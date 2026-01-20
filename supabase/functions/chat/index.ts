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

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  // CORS preflight
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

    // Safety: ensure key exists
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

    // Ensure session exists
    await supabase
      .from("chat_sessions")
      .upsert({ id: sessionId }, { onConflict: "id" });

    // Store user message
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: String(message),
    });

    // Load recent chat history
    const { data: history, error: histErr } = await supabase
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(12);

    if (histErr) console.error("history error:", histErr);

    // Load KB (business facts)
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

    // Build context in a stable order
    const kbMap = new Map<string, string>();
    for (const r of kbRows ?? []) kbMap.set(String(r.key), String(r.content));

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
`.trim();

    const userText = String(message);

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

    const inputMessages = [
      {
        role: "system" as const,
        content: `${SYSTEM}\n\nCONTEXT:\n${KB || "Δεν υπάρχουν διαθέσιμες πληροφορίες επιχείρησης."}`,
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
        // Για έλεγχο κόστους/μήκους:
        max_output_tokens: 250,
        temperature: 0.4,
      });

      reply = response.output_text || "…";
    } catch (err) {
      const phone = extractPhone(kbMap.get("phone"));
      const greek = isGreekText(userText);

      reply = greek
        ? `Η βάρδια μου ως Τεχνητή Νοημοσύνη τελείωσε. Πάρε τηλέφωνο στο ${phone} και θα σε βοηθήσω σαν αληθινός άνθρωπος.`
        : `My AI shift ended. Call ${phone} and I’ll help you like a real human.`;

      if (!isQuotaError(err)) console.error("OpenAI error:", err);
    }

    // Store bot reply
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "bot",
      content: reply,
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
