import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getChatSessionId } from "@/lib/chatSession";

type Message = {
  id: number;
  role: "user" | "bot";
  content: string;
};

function isGreekText(s: string) {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(s);
}

function looksLikeQuotaError(s: string) {
  return /429|resource_exhausted|quota|rate limit|rpd|insufficient_quota/i.test(
    s || "",
  );
}

export default function ChatBot() {
  const sessionId = useMemo(() => getChatSessionId(), []);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "bot", content: "Καλησπέρα 👋 Πώς μπορώ να σας βοηθήσω;" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: text },
    ]);
    setInput("");
    setLoading(true);

    const phone = "+30 6939949788";
    const greek = isGreekText(text);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: text, sessionId },
      });

      // If function returned a reply, use it even if status was weird
      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "bot", content: String(data.reply) },
        ]);
        return;
      }

      if (error) throw error;

      // Fallback if no error but also no reply
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", content: "…" },
      ]);
    } catch (err: any) {
      console.error(err);

      const msg = String(err?.message ?? err ?? "");
      const status = Number(err?.status ?? err?.code ?? 0);
      const quota = status === 429 || looksLikeQuotaError(msg);

      const fallback = quota
        ? greek
          ? `Η βάρδια μου ως Τεχνιτή Νοημοσύνη τελείωσε. Πάρε τηλέφωνο στο ${phone} και θα σε βοηθήσω σαν αληθινός άνθρωπος.`
          : `My AI shift ended. Call ${phone} and I’ll help you like a real human.`
        : greek
          ? `Η βάρδια μου ως Τεχνιτή Νοημοσύνη τελείωσε. Πάρε τηλέφωνο στο ${phone} και θα σε βοηθήσω σαν αληθινός άνθρωπος.`
          : `My AI shift ended. Call ${phone} and I’ll help you like a real human.`;

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: "bot", content: fallback },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-xl px-3 py-2 leading-snug ${
              m.role === "user"
                ? "ml-auto bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-900"
            }`}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="max-w-[85%] rounded-xl px-3 py-2 bg-zinc-100 text-zinc-900">
            Typing…
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 border-t border-black/10 pt-2 text-zinc-900">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-black/10 px-3 py-2 outline-none
                     focus:ring-2 focus:ring-zinc-900/20"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-white
                     hover:bg-zinc-800 disabled:opacity-60 active:scale-[0.98] transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
