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



function toPlus2Date(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 2 * 60 * 60 * 1000);
}

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
    // ---- Validate envs early (fail fast) ----
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Missing Supabase server env vars" });
    }
    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    }
    if (!ADMIN_TO) {
      return res.status(500).json({ error: "Missing ADMIN_EMAIL" });
    }

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

    // Link selected service (booking_service) + fetch meta for email/estimates
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
      serviceBasePrice =
        svcRow?.base_price != null ? Number(svcRow.base_price) : null;
      serviceDurationMin =
        (svcRow as any)?.duration_min != null
          ? Number((svcRow as any).duration_min)
          : 0;
    }

    // Link selected add-ons (booking_addon) + build details for email
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
            duration_min:
              (meta as any).duration_min != null
                ? Number((meta as any).duration_min)
                : 0,
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
              const price =
                a.base_price != null ? `${a.base_price.toFixed(2)}€` : "—";
              const dur = a.duration_min ? ` • +${a.duration_min}m` : "";
              return `<li>${escapeHtml(a.name)}${qty} — ${escapeHtml(
                price,
              )}${escapeHtml(dur)}</li>`;
            })
            .join("")}</ul>`;

    // Human datetime (keeps your +2h fix)
    const preferredHuman = formatPreferredAt(preferred_at);

  const { dateStr, timeStr } = getDateTimeStrings(preferred_at);

    // ---- Estimate price & duration (service + addons) ----
    const addonsTotalPrice = addonRowsForEmail.reduce((sum, a) => {
      const price = a.base_price != null ? a.base_price : 0;
      return sum + price * (a.quantity ?? 1);
    }, 0);

    const addonsTotalDuration = addonRowsForEmail.reduce((sum, a) => {
      const dur = a.duration_min != null ? a.duration_min : 0;
      return sum + dur * (a.quantity ?? 1);
    }, 0);

    const totalPrice =
      (serviceBasePrice != null ? serviceBasePrice : 0) + addonsTotalPrice;

    const totalDurationMin = (serviceDurationMin ?? 0) + addonsTotalDuration;

    const estimatedPrice =
      serviceBasePrice == null && addonRowsForEmail.length === 0
        ? null
        : `${totalPrice.toFixed(2)}€`;

    const estimatedDuration =
      (serviceDurationMin === 0 && addonsTotalDuration === 0)
        ? null
        : formatDuration(totalDurationMin);

    // -----------------------------
    // 1) ADMIN email (keep your existing behavior)
    // -----------------------------
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
      ${addonsHtml}
      `,
      ...(email ? { replyTo: email } : {}),
    });

    if (adminError) {
      console.error("Resend ADMIN email error:", adminError);
      // fail so you see it in logs and UI doesn't lie
      return res.status(502).json({
        error: "Failed to send admin email",
        details: adminError,
      });
    }
    console.log("Resend ADMIN email sent:", adminData);

    // -----------------------------
    // 2) CLIENT confirmation email
    // -----------------------------
    const { data: clientData, error: clientError } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "Booking Confirmed ✅ — Prime Detailing Cholargos",
      html: `
 <div style="margin:0;padding:0;background:#f6f7fb;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Η κράτησή σας επιβεβαιώθηκε — Prime Detailing Cholargos
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:28px 16px;">

        <!-- Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 14px 0;">
              <!-- Top brand row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td align="left" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:14px; color:#475569;">
                    <span style="font-weight:700; color:#0f172a;">Prime Detailing</span>
                    <span style="color:#94a3b8;"> · Cholargos</span>
                  </td>
                  <td align="right" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:12px; color:#94a3b8;">
                    Booking Confirmed ✅
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">

              <!-- Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:22px 22px 14px 22px;background:linear-gradient(135deg,#0ea5e9 0%,#2563eb 60%,#1d4ed8 100%);">
                    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; color:#ffffff;">
                      <div style="font-size:18px;font-weight:800;letter-spacing:-0.2px;">
                        Η κράτησή σας επιβεβαιώθηκε ✅
                      </div>
                      <div style="margin-top:6px;font-size:13px;opacity:0.92;">
                        Αν χρειαστείτε αλλαγή, απαντήστε σε αυτό το email ή καλέστε μας.
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:18px 22px 8px 22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0f172a;">
                    <div style="font-size:14px;line-height:1.6;">
                      Γεια σου <b>${escapeHtml(name)}</b>,
                      <br />
                      Σε περιμένουμε! Παρακάτω θα βρεις τα στοιχεία της κράτησης σου.
                    </div>
                  </td>
                </tr>

                <!-- Summary box -->
                <tr>
                  <td style="padding:10px 22px 0 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;">
                      <tr>
                        <td style="padding:14px 14px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                              <td style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;color:#64748b;padding-bottom:4px;">
                                Υπηρεσία
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:15px;font-weight:800;color:#0f172a;padding-bottom:12px;">
                                ${escapeHtml(serviceName ?? "—")}
                              </td>
                            </tr>

                            <tr>
                              <td>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td width="50%" style="padding-right:8px;vertical-align:top;">
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;color:#64748b;margin-bottom:4px;">Πότε</div>
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:700;color:#0f172a;">
                                        ${escapeHtml(dateStr ?? preferredHuman ?? "—")}
                                      </div>
                                    </td>
                                    <td width="50%" style="padding-left:8px;vertical-align:top;">
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;color:#64748b;margin-bottom:4px;">Ώρα</div>
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:700;color:#0f172a;">
                                        ${escapeHtml(timeStr ?? "—")}
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                            <tr>
                              <td style="padding-top:12px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td width="50%" style="padding-right:8px;vertical-align:top;">
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;color:#64748b;margin-bottom:4px;">Εκτιμώμενο κόστος</div>
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:800;color:#0f172a;">
                                        ${escapeHtml(estimatedPrice ?? "—")}
                                      </div>
                                    </td>
                                    <td width="50%" style="padding-left:8px;vertical-align:top;">
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;color:#64748b;margin-bottom:4px;">Εκτιμώμενος χρόνος υπηρεσίας</div>
                                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:800;color:#0f172a;">
                                        ${escapeHtml(estimatedDuration ?? "—")}
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                            <tr>
                              <td style="padding-top:12px;">
                               
                              </td>
                            </tr>

                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Add-ons (kept) -->
                <tr>
                  <td style="padding:16px 22px 0 22px;">
                    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:13px;font-weight:800;color:#0f172a;margin-bottom:10px;">
                      Add-ons
                    </div>

                    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:13px;color:#0f172a;line-height:1.6;text-align:left;">
                      ${addonsHtml}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Outer footer spacing -->
          <tr><td style="height:16px;line-height:16px;font-size:1px;">&nbsp;</td></tr>
        </table>

      </td>
    </tr>
  </table>
</div>
      `,
      replyTo: ADMIN_TO,
    });

    if (clientError) {
      console.error("Resend CLIENT email error:", clientError);
      return res.status(502).json({
        error: "Failed to send client email",
        details: clientError,
      });
    }
    console.log("Resend CLIENT email sent:", clientData);

    return res.status(200).json({ ok: true, booking_id: booking.id });
  } catch (err: any) {
    console.error("api/book error:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
