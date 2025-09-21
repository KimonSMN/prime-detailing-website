import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const FROM =
  process.env.RESEND_FROM || "Prime Detailing <onboarding@resend.dev>";
const TO = process.env.ADMIN_EMAIL || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  if (
    (req.headers.authorization || "") !==
    `Bearer ${process.env.BOOKING_WEBHOOK_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!process.env.RESEND_API_KEY || !TO) {
    return res
      .status(500)
      .json({ error: "Missing RESEND_API_KEY or ADMIN_EMAIL" });
  }

  try {
    const {
      id,
      name,
      email,
      phone,
      vehicle_info,
      notes,
      preferred_at,
      service_ids,
    } = (req.body || {}) as Record<string, any>;

    const list = Array.isArray(service_ids)
      ? service_ids.join(", ")
      : service_ids
      ? String(service_ids)
      : "";

    const subject = `New Booking: ${name || "Unknown"} — ${preferred_at ?? ""}`;
    const html = `
      <h2>New Booking</h2>
      <ul>
        <li><b>ID:</b> ${id ?? ""}</li>
        <li><b>Name:</b> ${name ?? ""}</li>
        <li><b>Email:</b> ${email ?? ""}</li>
        <li><b>Phone:</b> ${phone ?? ""}</li>
        <li><b>Date/Time:</b> ${preferred_at ?? ""}</li>
        <li><b>Service IDs:</b> ${list}</li>
        <li><b>Vehicle:</b> ${vehicle_info ?? ""}</li>
        <li><b>Notes:</b> ${notes ?? ""}</li>
      </ul>
    `;
    const text = [
      "New Booking",
      `ID: ${id ?? ""}`,
      `Name: ${name ?? ""}`,
      `Email: ${email ?? ""}`,
      `Phone: ${phone ?? ""}`,
      `Date/Time: ${preferred_at ?? ""}`,
      `Service IDs: ${list}`,
      `Vehicle: ${vehicle_info ?? ""}`,
      `Notes: ${notes ?? ""}`,
    ].join("\n");

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: [TO],
      subject,
      html,
      text,
      ...(email ? { reply_to: email } : {}),
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("booking-email error:", e);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
