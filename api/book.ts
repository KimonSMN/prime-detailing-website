// /api/book.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_TO = process.env.ADMIN_EMAIL!;
const FROM =
  process.env.RESEND_FROM || "Prime Detailing <onboarding@resend.dev>";
const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      name,
      email,
      phone,
      vehicleInfo,
      notes,
      preferred_at,
      serviceId,
      addonIds, // string[]
      addons, // { id: string; quantity?: number }[]
    } = (req.body || {}) as {
      name?: string;
      email?: string;
      phone?: string;
      vehicleInfo?: string | null;
      notes?: string | null;
      preferred_at?: string;
      serviceId?: string | null;
      addonIds?: string[] | null;
      addons?: { id: string; quantity?: number }[] | null;
    };

    if (!name || !email || !phone || !preferred_at) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalize add-on selection to an array of { id, quantity }
    const normalizedAddons: { id: string; quantity: number }[] = Array.isArray(
      addons
    )
      ? addons
          .filter((a) => a && typeof a.id === "string")
          .map((a) => ({
            id: a.id,
            quantity: Math.max(1, Number(a.quantity ?? 1)),
          }))
      : Array.isArray(addonIds)
      ? addonIds
          .filter((id): id is string => typeof id === "string")
          .map((id) => ({ id, quantity: 1 }))
      : [];

    // Upsert customer by unique email
    const { data: customer, error: upsertErr } = await supabase
      .from("customer")
      .upsert({ full_name: name, email, phone }, { onConflict: "email" })
      .select("id")
      .single();
    if (upsertErr) throw upsertErr;

    // Create booking
    const { data: booking, error: bookErr } = await supabase
      .from("booking")
      .insert({
        customer_id: customer.id,
        preferred_at,
        status: "pending",
        vehicle_info: vehicleInfo ?? null,
        notes: notes ?? null,
      })
      .select("id")
      .single();
    if (bookErr) throw bookErr;

    // Link selected service (booking_service)
    let serviceName: string | null = null;
    if (serviceId) {
      const { error: bsErr } = await supabase.from("booking_service").insert({
        booking_id: booking.id,
        service_id: serviceId,
        quantity: 1,
      });
      if (bsErr) throw bsErr;

      // Fetch service name for email
      const { data: svcRow } = await supabase
        .from("service")
        .select("name")
        .eq("id", serviceId)
        .maybeSingle();
      serviceName = svcRow?.name ?? null;
    }

    // Link selected add-ons (booking_addon)
    let addonRowsForEmail:
      | {
          id: string;
          name: string;
          base_price: number | null;
          duration_min: number;
          quantity: number;
        }[]
      | [] = [];

    if (normalizedAddons.length > 0) {
      // Insert rows
      const rows = normalizedAddons.map((a) => ({
        booking_id: booking.id,
        addon_id: a.id,
        quantity: a.quantity,
      }));
      const { error: baErr } = await supabase
        .from("booking_addon")
        .insert(rows);
      if (baErr) throw baErr;

      // Fetch add-on details for email
      const ids = normalizedAddons.map((a) => a.id);
      const { data: addonMeta, error: aMetaErr } = await supabase
        .from("addon")
        .select("id, name, base_price, duration_min")
        .in("id", ids);
      if (aMetaErr) throw aMetaErr;

      // merge quantity
      addonRowsForEmail = normalizedAddons
        .map((sel) => {
          const meta = addonMeta?.find((m) => m.id === sel.id);
          if (!meta) return null;
          return {
            id: meta.id,
            name: meta.name,
            base_price: (meta as any).base_price ?? null,
            duration_min: (meta as any).duration_min ?? 0,
            quantity: sel.quantity,
          };
        })
        .filter(Boolean) as typeof addonRowsForEmail;
    }

    // Email notification (with service + add-ons)
    const addonsHtml =
      addonRowsForEmail.length === 0
        ? "<em>None</em>"
        : `<ul>${addonRowsForEmail
            .map(
              (a) =>
                `<li>${a.name} ${
                  a.quantity > 1 ? `&times;${a.quantity}` : ""
                } — ${
                  a.base_price != null ? `${a.base_price.toFixed(2)}€` : "—"
                } • +${a.duration_min}m</li>`
            )
            .join("")}</ul>`;

    await resend.emails.send({
      from: FROM,
      to: [ADMIN_TO],
      subject: `New Booking: ${name} — ${preferred_at}`,
      html: `<h2>New Booking</h2>
      <ul>
        <li><b>Name:</b> ${name}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Phone:</b> ${phone}</li>
        <li><b>Date/Time:</b> ${preferred_at}</li>
        <li><b>Service:</b> ${serviceName ?? serviceId ?? ""}</li>
        <li><b>Vehicle:</b> ${vehicleInfo ?? ""}</li>
        <li><b>Notes:</b> ${notes ?? ""}</li>
      </ul>
      <h3>Selected Add-ons</h3>
      ${addonsHtml}
      `,
      ...(email ? { reply_to: email } : {}),
    });

    return res.status(200).json({ ok: true, booking_id: booking.id });
  } catch (err: any) {
    console.error("api/book error:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
