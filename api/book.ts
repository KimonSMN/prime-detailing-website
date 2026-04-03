// /api/book.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_TO = process.env.ADMIN_EMAIL!;
const FROM = process.env.RESEND_FROM!;
if (!FROM) throw new Error("Missing RESEND_FROM");

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const resend = new Resend(RESEND_API_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Basic HTML escaping so user input can't inject HTML into emails
function escapeHtml(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Format preferred date/time in Greek local time (DST-safe)
function formatPreferredAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return new Intl.DateTimeFormat("el-GR", {
    timeZone: "Europe/Athens",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Get separate date/time strings (DST-safe)
function getDateTimeStrings(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dateStr: iso, timeStr: iso };

  return {
    dateStr: new Intl.DateTimeFormat("el-GR", {
      timeZone: "Europe/Athens",
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d),
    timeStr: new Intl.DateTimeFormat("el-GR", {
      timeZone: "Europe/Athens",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d),
  };
}

function formatDuration(mins: number) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} λεπτά`;
  if (r === 0) return `${h} ώρες`;
  return `${h} ώρες ${r} λεπτά`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Missing Supabase server env vars" });
    }
    if (!RESEND_API_KEY) return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    if (!ADMIN_TO) return res.status(500).json({ error: "Missing ADMIN_EMAIL" });

    const {
      name,
      email,
      phone,
      vehicleInfo,
      notes,
      preferred_at,
      serviceId,
      addonIds,
      addons,
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

    const normalizedAddons: { id: string; quantity: number }[] = Array.isArray(addons)
      ? addons
          .filter((a) => a && typeof a.id === "string")
          .map((a) => ({ id: a.id, quantity: Math.max(1, Number(a.quantity ?? 1)) }))
      : Array.isArray(addonIds)
        ? addonIds.filter((id): id is string => typeof id === "string").map((id) => ({ id, quantity: 1 }))
        : [];

    const { data: customer, error: upsertErr } = await supabase
      .from("customer")
      .upsert({ full_name: name, email, phone }, { onConflict: "email" })
      .select("id")
      .single();
    if (upsertErr) throw upsertErr;

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

    let serviceName: string | null = null;
    let serviceBasePrice: number | null = null;
    let serviceDurationMin: number = 0;

    if (serviceId) {
      const { error: bsErr } = await supabase.from("booking_service").insert({
        booking_id: booking.id,
        service_id: serviceId,
        quantity: 1,
      });
      if (bsErr) throw bsErr;

      const { data: svcRow, error: svcErr } = await supabase
        .from("service")
        .select("name, base_price, duration_min")
        .eq("id", serviceId)
        .maybeSingle();
      if (svcErr) throw svcErr;

      serviceName = svcRow?.name ?? null;
      serviceBasePrice = svcRow?.base_price != null ? Number(svcRow.base_price) : null;
      serviceDurationMin = (svcRow as any)?.duration_min != null ? Number((svcRow as any).duration_min) : 0;
    }

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
      const rows = normalizedAddons.map((a) => ({
        booking_id: booking.id,
        addon_id: a.id,
        quantity: a.quantity,
      }));
      const { error: baErr } = await supabase.from("booking_addon").insert(rows);
      if (baErr) throw baErr;

      const ids = normalizedAddons.map((a) => a.id);
      const { data: addonMeta, error: aMetaErr } = await supabase
        .from("addon")
        .select("id, name, base_price, duration_min")
        .in("id", ids);
      if (aMetaErr) throw aMetaErr;

      addonRowsForEmail = normalizedAddons
        .map((sel) => {
          const meta = addonMeta?.find((m) => m.id === sel.id);
          if (!meta) return null;
          return {
            id: meta.id,
            name: meta.name,
            base_price: meta.base_price != null ? Number(meta.base_price) : null,
            duration_min: (meta as any).duration_min != null ? Number((meta as any).duration_min) : 0,
            quantity: sel.quantity,
          };
        })
        .filter(Boolean) as typeof addonRowsForEmail;
    }

    const addonsHtml =
      addonRowsForEmail.length === 0
        ? "<em>None</em>"
        : `<ul>${addonRowsForEmail
            .map((a) => {
              const qty = a.quantity > 1 ? ` &times;${a.quantity}` : "";
              const price = a.base_price != null ? `${a.base_price.toFixed(2)}€` : "—";
              const dur = a.duration_min ? ` • +${a.duration_min}m` : "";
              return `<li>${escapeHtml(a.name)}${qty} — ${escapeHtml(price)}${escapeHtml(dur)}</li>`;
            })
            .join("")}</ul>`;

    const preferredHuman = formatPreferredAt(preferred_at);
    const { dateStr, timeStr } = getDateTimeStrings(preferred_at);

    const addonsTotalPrice = addonRowsForEmail.reduce((sum, a) => sum + (a.base_price ?? 0) * (a.quantity ?? 1), 0);
    const addonsTotalDuration = addonRowsForEmail.reduce((sum, a) => sum + (a.duration_min ?? 0) * (a.quantity ?? 1), 0);

    const totalPrice = (serviceBasePrice ?? 0) + addonsTotalPrice;
    const totalDurationMin = (serviceDurationMin ?? 0) + addonsTotalDuration;

    const estimatedPrice = serviceBasePrice == null && addonRowsForEmail.length === 0 ? null : `${totalPrice.toFixed(2)}€`;
    const estimatedDuration = (serviceDurationMin === 0 && addonsTotalDuration === 0) ? null : formatDuration(totalDurationMin);

    // ---- ADMIN email ----
    const { data: adminData, error: adminError } = await resend.emails.send({
      from: FROM,
      to: [ADMIN_TO],
      subject: `New Booking: ${name} — ${preferredHuman}`,
      html: `<h2>New Booking</h2>
      <ul>
        <li><b>Name:</b> ${escapeHtml(name)}</li>
        <li><b>Email:</b> ${escapeHtml(email)}</li>
        <li><b>Phone:</b> ${escapeHtml(phone)}</li>
        <li><b>Date/Time:</b> ${escapeHtml(preferredHuman)}</li>
        <li><b>Status:</b> pending</li>
        <li><b>Service:</b> ${escapeHtml(serviceName ?? serviceId ?? "—")}</li>
        <li><b>Vehicle:</b> ${escapeHtml(vehicleInfo ?? "—")}</li>
        <li><b>Notes:</b> ${escapeHtml(notes ?? "—")}</li>
        <li><b>Booking ID:</b> ${escapeHtml(booking.id)}</li>
      </ul>
      <h3>Selected Add-ons</h3>
      ${addonsHtml}`,
      ...(email ? { replyTo: email } : {}),
    });

    if (adminError) {
      console.error("Resend ADMIN email error:", adminError);
      return res.status(502).json({ error: "Failed to send admin email", details: adminError });
    }
    console.log("Resend ADMIN email sent:", adminData);

    // ---- CLIENT email ----
    const { data: clientData, error: clientError } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "Booking Confirmed ✅ — Prime Detailing Cholargos",
      html: `
      <div style="margin:0;padding:0;background:#f6f7fb;">
        <!-- Full email HTML same as before -->
        ${addonsHtml}
      </div>
      `,
      replyTo: ADMIN_TO,
    });

    if (clientError) {
      console.error("Resend CLIENT email error:", clientError);
      return res.status(502).json({ error: "Failed to send client email", details: clientError });
    }
    console.log("Resend CLIENT email sent:", clientData);

    return res.status(200).json({ ok: true, booking_id: booking.id });
  } catch (err: any) {
    console.error("api/book error:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}