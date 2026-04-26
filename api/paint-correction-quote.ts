import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ADMIN_TO = process.env.ADMIN_EMAIL!;
const FROM = process.env.RESEND_FROM!;

function escapeHtml(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const resend = new Resend(RESEND_API_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Missing Supabase server env vars" });
    }
    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    }
    if (!ADMIN_TO) {
      return res.status(500).json({ error: "Missing ADMIN_EMAIL" });
    }
    if (!FROM) {
      return res.status(500).json({ error: "Missing RESEND_FROM" });
    }

    const {
      serviceType,
      carModel,
      carColor,
      fullName,
      phone,
      email,
    } = (req.body || {}) as {
      serviceType?: string;
      carModel?: string;
      carColor?: string;
      fullName?: string;
      phone?: string;
      email?: string;
    };

    if (!serviceType || !carModel || !fullName || !phone || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const carInfo = carColor ? `${carModel} (${carColor})` : carModel;

    const { error: leadError } = await supabase.from("correction_leads").insert([
      {
        service_type: serviceType,
        car_info: carInfo,
        full_name: fullName,
        phone,
        email,
      },
    ]);

    if (leadError) throw leadError;

    const { error: adminError } = await resend.emails.send({
      from: FROM,
      to: [ADMIN_TO],
      subject: `New Paint Correction Quote: ${fullName}`,
      html: `<h2>New Paint Correction Quote Request</h2>
      <ul>
        <li><b>Name:</b> ${escapeHtml(fullName)}</li>
        <li><b>Email:</b> ${escapeHtml(email)}</li>
        <li><b>Phone:</b> ${escapeHtml(phone)}</li>
        <li><b>Treatment:</b> ${escapeHtml(serviceType)}</li>
        <li><b>Car:</b> ${escapeHtml(carInfo)}</li>
      </ul>`,
      replyTo: email,
    });

    if (adminError) {
      console.error("Resend ADMIN quote email error:", adminError);
      return res.status(502).json({
        error: "Failed to send admin email",
        details: adminError,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("api/paint-correction-quote error:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}