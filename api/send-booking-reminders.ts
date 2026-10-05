import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone, zonedTimeToUtc } from "date-fns-tz";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM;
const REMINDERS_START_AT = process.env.BOOKING_REMINDERS_START_AT;
const CRON_SECRET = process.env.CRON_SECRET;
const ATHENS_TIME_ZONE = "Europe/Athens";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getDateTimeStrings(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { dateStr: iso, timeStr: iso };

  return {
    dateStr: new Intl.DateTimeFormat("el-GR", {
      timeZone: "Europe/Athens",
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date),
    timeStr: new Intl.DateTimeFormat("el-GR", {
      timeZone: "Europe/Athens",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function getTomorrowInAthens() {
  const today = formatInTimeZone(new Date(), ATHENS_TIME_ZONE, "yyyy-MM-dd");
  const todayUtc = new Date(`${today}T00:00:00Z`);
  const tomorrowUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrowUtc = new Date(
    tomorrowUtc.getTime() + 24 * 60 * 60 * 1000,
  );
  const tomorrow = formatInTimeZone(
    tomorrowUtc,
    "UTC",
    "yyyy-MM-dd",
  );
  const dayAfterTomorrow = formatInTimeZone(
    dayAfterTomorrowUtc,
    "UTC",
    "yyyy-MM-dd",
  );

  return {
    start: zonedTimeToUtc(`${tomorrow} 00:00:00`, ATHENS_TIME_ZONE).toISOString(),
    end: zonedTimeToUtc(
      `${dayAfterTomorrow} 00:00:00`,
      ATHENS_TIME_ZONE,
    ).toISOString(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !RESEND_API_KEY ||
    !FROM ||
    !REMINDERS_START_AT
  ) {
    return res.status(500).json({
      error:
        "Missing reminder env vars: Supabase, Resend, or BOOKING_REMINDERS_START_AT",
    });
  }

  const reminderStart = new Date(REMINDERS_START_AT);
  if (Number.isNaN(reminderStart.getTime())) {
    return res.status(500).json({ error: "Invalid BOOKING_REMINDERS_START_AT" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const resend = new Resend(RESEND_API_KEY);
  const { start: tomorrowStart, end: tomorrowEnd } = getTomorrowInAthens();

  const { data: bookings, error: bookingError } = await supabase
    .from("booking")
    .select("id, customer_id, preferred_at")
    .gte("created_at", reminderStart.toISOString())
    .gte("preferred_at", tomorrowStart)
    .lt("preferred_at", tomorrowEnd)
    .is("reminder_sent_at", null)
    .in("status", ["pending", "confirmed"])
    .order("preferred_at", { ascending: true })
    .limit(100);

  if (bookingError) {
    console.error("Reminder booking lookup failed:", bookingError);
    return res.status(500).json({ error: "Failed to load bookings" });
  }

  let sent = 0;
  for (const booking of bookings ?? []) {
    const { data: customer, error: customerError } = await supabase
      .from("customer")
      .select("full_name, email")
      .eq("id", booking.customer_id)
      .maybeSingle();

    if (customerError) {
      console.error("Reminder customer lookup failed:", customerError);
      continue;
    }

    if (
      !customer?.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
      customer.email.endsWith("@internal.invalid")
    ) {
      continue;
    }

    const { data: serviceRows, error: serviceError } = await supabase
      .from("booking_service")
      .select("service(name)")
      .eq("booking_id", booking.id)
      .limit(1);

    if (serviceError) {
      console.error("Reminder service lookup failed:", serviceError);
    }

    const serviceRelation = serviceRows?.[0]?.service as unknown;
    const serviceName = (
      Array.isArray(serviceRelation)
        ? serviceRelation[0]?.name
        : (serviceRelation as { name?: string } | null)?.name
    ) ?? "—";
    const { dateStr, timeStr } = getDateTimeStrings(booking.preferred_at);
    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: [customer.email],
      subject: "Υπενθύμιση: Το ραντεβού σας είναι αύριο | Prime Detailing Cholargos",
      html: `<div style="margin:0;padding:0;background:#f6f7fb;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Υπενθύμιση: Το ραντεβού σας στην Prime Detailing είναι αύριο.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f6f7fb;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,sans-serif;font-size:14px;color:#475569;">
                    <strong style="color:#0f172a;">Prime Detailing</strong>
                    <span style="color:#94a3b8;"> · Cholargos</span>
                  </td>
                  <td align="right" style="font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">
                    Appointment Reminder
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 22px;background:#1677e8;background-image:linear-gradient(135deg,#0ea5e9 0%,#2563eb 60%,#1d4ed8 100%);font-family:Arial,sans-serif;color:#ffffff;">
                    <div style="font-size:21px;font-weight:800;line-height:1.4;">Το ραντεβού σας είναι αύριο!</div>
                    <div style="margin-top:8px;font-size:14px;line-height:1.7;">Ανυπομονούμε να σας υποδεχτούμε στην Prime Detailing.</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 22px 12px;font-family:Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.8;">
                    Γεια σου <strong>${escapeHtml(customer.full_name)}</strong>,<br />
                    Μια μικρή υπενθύμιση ότι το ραντεβού σου πλησιάζει. Παρακάτω θα βρεις τα στοιχεία της κράτησης σου.
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 22px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;">
                      <tr>
                        <td style="padding:18px 16px;font-family:Arial,sans-serif;">
                          <div style="font-size:12px;color:#64748b;margin-bottom:5px;">ΥΠΗΡΕΣΙΑ</div>
                          <div style="font-size:16px;font-weight:800;color:#0f172a;line-height:1.5;">${escapeHtml(serviceName)}</div>
                          <div style="height:1px;background:#e5e7eb;margin:16px 0;"></div>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="55%" style="vertical-align:top;padding-right:8px;">
                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">ΗΜΕΡΟΜΗΝΙΑ</div>
                                <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.6;">${escapeHtml(dateStr)}</div>
                              </td>
                              <td width="45%" style="vertical-align:top;padding-left:8px;">
                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">ΩΡΑ</div>
                                <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.6;">${escapeHtml(timeStr)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 22px 22px;font-family:Arial,sans-serif;color:#475569;font-size:13px;line-height:1.8;">
                    <strong style="color:#0f172a;">Χρήσιμη υπενθύμιση</strong><br />
                    Παρακαλούμε να βρίσκεστε στο κατάστημα την προγραμματισμένη ώρα του ραντεβού σας.<br /><br />
                    Αν χρειαστείτε κάποια αλλαγή στην κράτηση σας, καλέστε μας στο <a href="tel:+306939949788">+30 693 994 9788</a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 22px;background:#f8fafc;border-top:1px solid #e5e7eb;font-family:Arial,sans-serif;text-align:center;">
                    <div style="font-size:14px;font-weight:800;color:#0f172a;">Prime Detailing</div>
                    <div style="margin-top:10px;font-size:11px;color:#94a3b8;">Αυτό το email είναι μια αυτοματοποιημένη υπενθύμιση της κράτησης σας.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`,
      replyTo: FROM,
    });

    if (emailError) {
      console.error("Reminder email failed:", emailError);
      continue;
    }

    const { error: markError } = await supabase
      .from("booking")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", booking.id)
      .is("reminder_sent_at", null);

    if (markError) {
      console.error("Reminder status update failed:", markError);
      continue;
    }

    sent += 1;
  }

  return res.status(200).json({ ok: true, found: bookings?.length ?? 0, sent });
}
