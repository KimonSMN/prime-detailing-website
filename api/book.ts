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
    const { name, email, phone, vehicleInfo, notes, preferred_at, serviceId } =
      req.body || {};

    if (!name || !email || !phone || !preferred_at) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    // Optional: link selected service
    if (serviceId) {
      await supabase.from("booking_service").insert({
        booking_id: booking.id,
        service_id: serviceId,
      });
    }

    // Email notification
    await resend.emails.send({
      from: FROM,
      to: [ADMIN_TO],
      subject: `New Booking: ${name} — ${preferred_at}`,
      html: `<h2>New Booking</h2><ul>
        <li><b>Name:</b> ${name}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Phone:</b> ${phone}</li>
        <li><b>Date/Time:</b> ${preferred_at}</li>
        <li><b>Service ID:</b> ${serviceId ?? ""}</li>
        <li><b>Vehicle:</b> ${vehicleInfo ?? ""}</li>
        <li><b>Notes:</b> ${notes ?? ""}</li>
      </ul>`,
      ...(email ? { reply_to: email } : {}),
    });

    return res.status(200).json({ ok: true, booking_id: booking.id });
  } catch (err: any) {
    console.error("api/book error:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
