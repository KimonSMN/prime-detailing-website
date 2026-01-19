import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "https://esm.sh/@google/genai";

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
    msg.toUpperCase().includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("quota")
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

    const ai = new GoogleGenAI({
      apiKey: Deno.env.get("GEMINI_API_KEY")!,
    });

    const SYSTEM = `
You are the website assistant for Prime Detailing Cholargos.

Language:
- Default to English.
- If the user writes in Greek or asks for Greek, respond in Greek.
- If the user mixes languages, mirror their language.

Tone:
- Normal, short, direct. No marketing fluff. No long greetings.
- No formatting. No asterisks. No quotes. No markdown.

Rules:
- Use ONLY the facts in CONTEXT. Do not invent services, prices, hours, address, or policies.
- Never mention website paths like /booking or any URL path. Always direct them to call the phone number from CONTEXT.
- If user asks about Paint Correction, use the exact price from CONTEXT (paint_correction) and mention that final quote depends on condition.
- If user asks about Ceramic Coating, use the exact tier prices from CONTEXT (ceramic_coating).
- If the user asks generally for "price/prices", reply with a short list of package starting prices + paint correction + ceramic coating tiers, then ask which service they want.
- Ask at most ONE clarifying question when needed.
- End with the phone number from CONTEXT when the user is asking about booking/prices or next steps.
`;

    const userText = String(message);

    const prompt = [
      `System: ${SYSTEM}`,
      `CONTEXT:`,
      KB || "No business info provided.",
      ``,
      ...(history ?? []).map(
        (m) => `${m.role === "bot" ? "Assistant" : "User"}: ${m.content}`,
      ),
      `User: ${userText}`,
      `Assistant:`,
    ].join("\n");

    // Gemini call + quota fallback
    let reply = "…";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      reply = response.text || "…";
    } catch (err) {
      const phone = extractPhone(kbMap.get("phone"));
      const greek = isGreekText(userText);

      if (isQuotaError(err)) {
        reply = greek
          ? `Η βάρδια μου ως Τεχνιτή Νοημοσύνη τελείωσε. Πάρε τηλέφωνο στο ${phone} και θα σε βοηθήσω σαν αληθινός άνθρωπος.`
          : `My AI shift ended. Call ${phone} and I’ll help you like a real human.`;
      } else {
        reply = greek
          ? `Κάτι πήγε στραβά. Παρε τηλεφωνο στο ${phone}.`
          : `Something went wrong. Call ${phone}.`;
      }
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
