// /api/book.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_TO = process.env.ADMIN_EMAIL!; // keep using this for your email (kimonsmirlianos@gmail.com)
const FROM =
  process.env.RESEND_FROM || "Prime Detailing <onboarding@resend.dev>";
const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Basic HTML escaping to avoid user-provided content injecting HTML into emails */
function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Format ISO timestamp into Greece-friendly string */
function formatPreferredAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("el-GR", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

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
      addons,
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

    // Create booking (pending)
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

    // Link selected service (booking_service) + snapshot price_at_booking (recommended)
    let serviceName: string | null = null;
    let servicePrice: number | null = null;

    if (serviceId) {
      // Fetch service name + price for email and price snapshot
      const { data: svcRow, error: svcErr } = await supabase
        .from("service")
        .select("name, base_price")
        .eq("id", serviceId)
        .maybeSingle();
      if (svcErr) throw svcErr;

      serviceName = svcRow?.name ?? null;
      servicePrice =
        typeof (svcRow as any)?.base_price === "number"
          ? (svcRow as any).base_price
          : svcRow?.base_price != null
            ? Number(svcRow.base_price)
            : null;

      const { error: bsErr } = await supabase.from("booking_service").insert({
        booking_id: booking.id,
        service_id: serviceId,
        quantity: 1,
        price_at_booking: servicePrice, // snapshot (nullable if missing)
      });
      if (bsErr) throw bsErr;
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
      const { error: baErr } = await supabase.from("booking_addon").insert(rows);
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
            base_price: meta.base_price != null ? Number(meta.base_price) : null,
            duration_min:
              (meta as any).duration_min != null
                ? Number((meta as any).duration_min)
                : 0,
            quantity: sel.quantity,
          };
        })
        .filter(Boolean) as typeof addonRowsForEmail;
    }

    // Build Add-ons HTML (for both admin + customer)
    const addonsHtml =
      addonRowsForEmail.length === 0
        ? "<em>None</em>"
        : `<ul>${addonRowsForEmail
            .map((a) => {
              const price =
                a.base_price != null ? `${a.base_price.toFixed(2)}€` : "—";
              const qty = a.quantity > 1 ? ` &times;${a.quantity}` : "";
              const dur = a.duration_min ? ` • +${a.duration_min}m` : "";
              return `<li>${escapeHtml(a.name)}${qty} — ${escapeHtml(
                price,
              )}${escapeHtml(dur)}</li>`;
            })
            .join("")}</ul>`;

    const preferredHuman = formatPreferredAt(preferred_at);

    // 1) ADMIN email (keep existing behavior)
    await resend.emails.send({
      from: FROM,
      to: [ADMIN_TO],
      subject: `New Booking: ${name} — ${preferred_at}`,
      html: `<h2>New Booking</h2>
      <ul>
        <li><b>Name:</b> ${escapeHtml(name)}</li>
        <li><b>Email:</b> ${escapeHtml(email)}</li>
        <li><b>Phone:</b> ${escapeHtml(phone)}</li>
        <li><b>Date/Time:</b> ${escapeHtml(preferredHuman)}</li>
        <li><b>Status:</b> pending</li>
        <li><b>Service:</b> ${
          serviceName
            ? `${escapeHtml(serviceName)}${
                servicePrice != null ? ` — ${servicePrice.toFixed(2)}€` : ""
              }`
            : escapeHtml(serviceId ?? "—")
        }</li>
        <li><b>Vehicle:</b> ${escapeHtml(vehicleInfo ?? "—")}</li>
        <li><b>Notes:</b> ${escapeHtml(notes ?? "—")}</li>
        <li><b>Booking ID:</b> ${escapeHtml(booking.id)}</li>
      </ul>
      <h3>Selected Add-ons</h3>
      ${addonsHtml}
      `,
      ...(email ? { reply_to: email } : {}),
    });

    // 2) CUSTOMER confirmation email (new)
    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "We received your booking request — Prime Detailing",
      html: `
        <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5">
          <h2>Booking request received ✅</h2>
          <p>Hi ${escapeHtml(name)},</p>
          <p>
            We received your booking request and we’ll confirm it shortly.
          </p>

          <h3>Details</h3>
          <ul>
            <li><b>Date/Time requested:</b> ${escapeHtml(preferredHuman)}</li>
            <li><b>Service:</b> ${
              serviceName
                ? `${escapeHtml(serviceName)}${
                    servicePrice != null
                      ? ` — ${servicePrice.toFixed(2)}€`
                      : ""
                  }`
                : "—"
            }</li>
            <li><b>Add-ons:</b> ${addonsHtml}</li>
            <li><b>Vehicle:</b> ${escapeHtml(vehicleInfo ?? "—")}</li>
            <li><b>Notes:</b> ${escapeHtml(notes ?? "—")}</li>
          </ul>

          <p style="margin-top:16px">
            If you need to change anything, reply to this email.
          </p>

          <p>— Prime Detailing</p>
        </div>
      `,
      // Replies go to you (admin), not to Resend sender
      reply_to: ADMIN_TO,
    });

    return res.status(200).json({ ok: true, booking_id: booking.id });
  } catch (err: any) {
    console.error("api/book error:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
