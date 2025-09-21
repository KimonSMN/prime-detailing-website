// /api/book.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ---- server-only envs (set in Vercel: Production) ----
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service_role (secret)
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const FROM =
  process.env.RESEND_FROM || "Prime Detailing <onboarding@resend.dev>";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const resend = new Resend(RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !RESEND_API_KEY ||
    !ADMIN_EMAIL
  ) {
    return res.status(500).json({ error: "Missing server env vars" });
  }

  try {
    const {
      name,
      email,
      phone,
      serviceId,
      vehicleInfo,
      notes,
      preferred_at, // ISO string
    } = (req.body || {}) as Record<string, any>;

    // minimal validation
    if (!name || !email || !phone || !preferred_at) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1) upsert customer by email
    const { data: cust, error: custErr } = await supabase
      .from("customer")
      .upsert({ email, full_name: name, phone }, { onConflict: "email" })
      .select("id, full_name, email, phone")
      .single();
    if (custErr) throw custErr;

    // 2) insert booking
    const { data: booking, error: bookErr } = await supabase
      .from("booking")
      .insert({
        customer_id: cust.id,
        preferred_at, // ISO → timestamptz
        status: "pending",
        vehicle_info: vehicleInfo || null,
        notes: notes || null,
      })
      .select("id, preferred_at")
      .single();
    if (bookErr) throw bookErr;

    // 3) (optional) link service in a join table
    // if (serviceId) {
    //   await supabase.from("booking_service")
    //     .insert({ booking_id: booking.id, service_id: serviceId });
    // }

    // 4) email you
    const subject = `New Booking: ${name} — ${preferred_at}`;
    const html = `
      <h2>New Booking</h2>
      <ul>
        <li><b>Booking ID:</b> ${booking.id}</li>
        <li><b>Name:</b> ${name}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Phone:</b> ${phone}</li>
        <li><b>Date/Time:</b> ${preferred_at}</li>
        <li><b>Service ID:</b> ${serviceId || ""}</li>
        <li><b>Vehicle:</b> ${vehicleInfo || ""}</li>
        <li><b>Notes:</b> ${notes || ""}</li>
      </ul>
    `;
    const text = [
      `New Booking`,
      `Booking ID: ${booking.id}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Date/Time: ${preferred_at}`,
      `Service ID: ${serviceId || ""}`,
      `Vehicle: ${vehicleInfo || ""}`,
      `Notes: ${notes || ""}`,
    ].join("\n");

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject,
      html,
      text,
      reply_to: email,
    });
    if (sendError) {
      console.error("Resend error:", sendError);
      // we still return ok; booking is stored even if email fails
    }

    return res.status(200).json({ ok: true, booking_id: booking.id });
  } catch (err: any) {
    console.error("book endpoint error:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err?.message || String(err) });
  }
}
