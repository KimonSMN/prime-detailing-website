import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "npm:openai";

const ALLOWED_ORIGINS = new Set([
  "https://prime-detailing-cholargos.com",
  "https://www.prime-detailing-cholargos.com",
  "http://localhost:8080",
  "http://localhost:5173",
]);

function buildCorsHeaders(origin: string | null) {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://prime-detailing-cholargos.com";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

function isGreekText(s: string) {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(s);
}

function extractPhone(kbPhone: string | undefined) {
  const m = (kbPhone ?? "").match(/\+\d[\d\s-]{7,}/);
  return (m?.[0] ?? "+30 6939949788").trim();
}

function isQuotaError(err: unknown) {
  const msg = String((err as any)?.message ?? err ?? "");
  const status = (err as any)?.status ?? (err as any)?.code;
  return (
    status === 429 ||
    msg.includes("429") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("quota") ||
    msg.toLowerCase().includes("insufficient_quota")
  );
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Supabase sometimes forwards this too (depending on setup)
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "unknown";
}

// Rate limits
const WINDOW_SECONDS = 60;
const MAX_PER_WINDOW_PER_IP = 12; // 12 user messages / minute / IP
const MAX_PER_WINDOW_PER_SESSION = 8; // 8 user messages / minute / session
const MAX_PER_DAY_PER_IP = 2; // daily cap / IP

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { message, sessionId } = await req.json();

    if (!message || !sessionId) {
      return new Response("Bad request", {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!Deno.env.get("OPENAI_API_KEY")) {
      return new Response(
        JSON.stringify({
          reply: "Λείπει το OPENAI_API_KEY στο Supabase secrets.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
    );

    const userText = String(message);
    const ip = getClientIp(req);

    // Ensure session exists
    await supabase
      .from("chat_sessions")
      .upsert({ id: sessionId }, { onConflict: "id" });

    // Load KB first (so we can use phone in rate-limit response too)
    const kbKeys = [
      "location",
      "hours",
      "phone",
      "booking",
      "packages",
      "services",
      "pricing",
      "paint_correction",
      "ceramic_coating",
    ];

    const { data: kbRows, error: kbErr } = await supabase
      .from("chat_kb")
      .select("key,content")
      .in("key", kbKeys);

    if (kbErr) console.error("kb error:", kbErr);

    const kbMap = new Map<string, string>();
    for (const r of kbRows ?? []) kbMap.set(String(r.key), String(r.content));

    const phone = extractPhone(kbMap.get("phone"));

    // -------------------------
    // RATE LIMIT (server-side)
    // -------------------------
    const windowSince = new Date(
      Date.now() - WINDOW_SECONDS * 1000,
    ).toISOString();

    const daySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Per-IP rolling window
    const { count: ipWindowCount, error: ipWinErr } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .eq("ip", ip)
      .gte("created_at", windowSince);

    if (ipWinErr) console.error("rate ip window error:", ipWinErr);

    // Per-session rolling window
    const { count: sessionWindowCount, error: sessWinErr } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .eq("session_id", sessionId)
      .gte("created_at", windowSince);

    if (sessWinErr) console.error("rate session window error:", sessWinErr);

    // Optional daily cap per IP
    const { count: ipDayCount, error: ipDayErr } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .eq("ip", ip)
      .gte("created_at", daySince);

    if (ipDayErr) console.error("rate ip day error:", ipDayErr);

    const exceeded =
      (ip !== "unknown" && (ipWindowCount ?? 0) >= MAX_PER_WINDOW_PER_IP) ||
      (sessionWindowCount ?? 0) >= MAX_PER_WINDOW_PER_SESSION ||
      (ip !== "unknown" && (ipDayCount ?? 0) >= MAX_PER_DAY_PER_IP);

    if (exceeded) {
      const greek = isGreekText(userText);
      const reply = greek
        ? `Πολλά μηνύματα σε σύντομο χρόνο. Πάρε τηλέφωνο στο ${phone}.`
        : `Too many messages in a short time. Call ${phone}.`;

      return new Response(JSON.stringify({ reply }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store user message (with IP)
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: userText,
      ip,
    });

    // Load recent chat history
    const { data: history, error: histErr } = await supabase
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(12);

    if (histErr) console.error("history error:", histErr);

    // Build context in a stable order
    const KB = kbKeys
      .filter((k) => kbMap.has(k))
      .map((k) => `${k.toUpperCase()}: ${kbMap.get(k)}`)
      .join("\n");

    const SYSTEM = `
Είσαι ο βοηθός του site “Prime Detailing Cholargos”.

Γλώσσα:
- Default απάντηση στα Ελληνικά.
- Αν ο χρήστης γράψει στα Αγγλικά ή ζητήσει Αγγλικά, απάντα στα Αγγλικά.
- Αν ο χρήστης μιξάρει γλώσσες, ακολούθησε τη γλώσσα του.

Ύφος:
- Κανονικό, σύντομο, ευθύ. Χωρίς marketing fluff. Χωρίς μεγάλους χαιρετισμούς.
- Χωρίς μορφοποίηση. Όχι αστεράκια, όχι quotes, όχι markdown.

Κανόνες:
- Χρησιμοποίησε ΜΟΝΟ τις πληροφορίες στο CONTEXT. Μην επινοείς υπηρεσίες, τιμές, ωράρια, διευθύνσεις ή πολιτικές.
- Μην αναφέρεις ποτέ paths του site (π.χ. /booking) ή URLs. Για ραντεβού/επόμενα βήματα να λες να καλέσουν στο τηλέφωνο από το CONTEXT.
- Αν ρωτήσουν για Paint Correction, χρησιμοποίησε την ΑΚΡΙΒΗ τιμή από το CONTEXT (paint_correction) και πες ότι το τελικό κόστος εξαρτάται από την κατάσταση.
- Αν ρωτήσουν για Ceramic Coating, χρησιμοποίησε τις ΑΚΡΙΒΕΙΣ τιμές tiers από το CONTEXT (ceramic_coating).
- Αν ρωτήσουν γενικά για “τιμές/price/prices”, απάντα με μια σύντομη λίστα: starting prices πακέτων + paint correction + ceramic coating tiers, και μετά κάνε ΜΙΑ διευκρινιστική ερώτηση (ποια υπηρεσία θέλουν).
- Κάνε το πολύ ΜΙΑ διευκρινιστική ερώτηση όταν χρειάζεται.
- Να κλείνεις με το τηλέφωνο από το CONTEXT όταν ο χρήστης ρωτά για booking/τιμές/επόμενα βήματα.
- Αν δεν ξέρεις την απάντηση, πες “Δεν είμαι σίγουρος/η γι' αυτό. Πάρε τηλέφωνο στο +30 6939949788 για να σε βοηθήσουμε καλύτερα.”
- Μετα απο καθε κόμμα ή τελεία, γράψε απο κάτω την επόμενη πρόταση.
`.trim();

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

    const inputMessages = [
      {
        role: "system" as const,
        content: `${SYSTEM}\n\nCONTEXT:\n${
          KB || "Δεν υπάρχουν διαθέσιμες πληροφορίες επιχείρησης."
        }`,
      },
      ...(history ?? []).map((m: any) => ({
        role: (m.role === "bot" ? "assistant" : "user") as "assistant" | "user",
        content: String(m.content),
      })),
      { role: "user" as const, content: userText },
    ];

    let reply = "…";
    try {
      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: inputMessages,
        max_output_tokens: 250,
        temperature: 0.4,
      });

      reply = response.output_text || "…";
    } catch (err) {
      const greek = isGreekText(userText);

      reply = greek
        ? `Η βάρδια μου ως Τεχνητή Νοημοσύνη τελείωσε. Πάρε τηλέφωνο στο ${phone} και θα σε βοηθήσω σαν αληθινός άνθρωπος.`
        : `My AI shift ended. Call ${phone} and I’ll help you like a real human.`;

      if (!isQuotaError(err)) console.error("OpenAI error:", err);
    }

    // Store bot reply (optional: keep ip too for debugging/abuse forensics)
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "bot",
      content: reply,
      ip,
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
