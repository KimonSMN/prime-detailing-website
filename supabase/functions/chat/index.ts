import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "https://esm.sh/@google/genai";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message, sessionId } = await req.json();
    if (!message || !sessionId) {
      return new Response("Bad request", { status: 400 });
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
      content: message,
    });

    // Load recent history (context)
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role,content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(12);

    // --- GEMINI ---
    const ai = new GoogleGenAI({
      apiKey: Deno.env.get("GEMINI_API_KEY")!,
    });

    const prompt = [
      "You are a helpful website assistant.",
      "",
      ...(history ?? []).map(
        (m) => `${m.role === "bot" ? "Assistant" : "User"}: ${m.content}`,
      ),
      "Assistant:",
    ].join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const reply = response.text || "…";

    // Store bot reply
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "bot",
      content: reply,
    });

    return Response.json({ reply });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
});
