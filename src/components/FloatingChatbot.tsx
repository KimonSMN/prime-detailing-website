import { useState } from "react";
import ChatBot from "@/components/ChatBot";

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[360px] max-w-[calc(100vw-2.5rem)] h-[520px]
                        overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"
        >
          <div className="h-12 px-3 flex items-center justify-end border-b border-black/10 bg-zinc-60">
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-xl border border-black/10 bg-zinc-900 hover:bg-zinc-700"
            >
              ✕
            </button>
          </div>

          <div className="h-[calc(100%-3rem)] p-3">
            <ChatBot />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-secondary text-white text-2xl shadow-2xl
                   hover:bg-secondary-hover active:scale-[0.98] transition"
      >
        {open ? "—" : "💬"}
      </button>
    </div>
  );
}
