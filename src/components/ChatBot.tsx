import { useState } from "react";

type Message = {
  id: number;
  role: "user" | "bot";
  content: string;
};

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      content: "Hi 👋 How can I help you?",
    },
  ]);
  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Fake bot reply (replace later with API call)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          content: "Got it 👍 (hook me to a backend next)",
        },
      ]);
    }, 600);
  }

  return (
    <div className="flex h-full flex-col text-sm">
      {/* Messages */}
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
      </div>

      {/* Input */}
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
          className="rounded-xl bg-zinc-900 px-4 py-2 text-white
                     hover:bg-zinc-800 active:scale-[0.98] transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
