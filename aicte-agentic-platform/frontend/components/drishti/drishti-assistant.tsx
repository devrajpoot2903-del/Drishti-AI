"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bot,
  X,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function DrishtiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    const question = input.trim();

    if (!question || loading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Assistant service unavailable");
      }

      const data = await response.json();

      if (typeof data.answer !== "string") {
        throw new Error("Invalid assistant response");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch {
      setError(
        "The assistant is currently unavailable. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="drishti-glass mb-4 flex h-[500px] w-[370px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4 bg-[#14151c]/60">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2 text-red-400 border border-red-500/20">
                  <Bot size={19} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Drishti Assistant
                  </h3>

                  <p className="text-xs text-gray-400">
                    Platform Support
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div
              role="log"
              aria-live="polite"
              className="flex-1 space-y-4 overflow-y-auto p-4"
            >
              {messages.length === 0 && (
                <div className="py-12 text-center">
                  <MessageSquare
                    className="mx-auto mb-4 text-red-400"
                    size={28}
                  />

                  <h4 className="font-medium text-white">
                    How can I help?
                  </h4>

                  <p className="mt-2 text-sm text-gray-400 px-4">
                    Ask questions about Drishti AI,
                    document uploads, or application processing.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-red-500 text-white"
                        : "border border-white/10 bg-white/5 text-gray-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={15} className="animate-spin text-red-400" />
                  Processing your question...
                </div>
              )}

              {error && (
                <p role="alert" className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-white/10 p-4 bg-[#14151c]/60">
              <div className="flex gap-2">
                <input
                  className="drishti-input text-sm"
                  placeholder="Ask Drishti Assistant..."
                  aria-label="Message Drishti Assistant"
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="drishti-button disabled:opacity-50 flex items-center justify-center"
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 cursor-pointer hover:bg-red-600 transition-colors"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </motion.button>
    </div>
  );
}
