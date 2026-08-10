"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { BRAND_CONFIG } from "@/lib/brand-config";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Hi! I'm the ${BRAND_CONFIG.shortCompanyName} Assistant. Ask me about features, pricing, or how to get started — Tagalog or English, either works.`,
};

const QUICK_PROMPTS = [
  "Ano ang QuickPawn?",
  "Magkano ang pricing?",
  "Paano mag-start?",
];

type LandingChatbotProps = {
  onScrollToContact?: () => void;
};

export function LandingChatbot({ onScrollToContact }: LandingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isSending, isOpen]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSending) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const history = nextMessages
        .filter((msg) => msg.id !== "welcome")
        .slice(-12)
        .map((msg) => ({ role: msg.role, content: msg.content }));

      const response = await api.post<{ reply: string }>(
        "/chat/landing",
        {
          message: text,
          history: history.slice(0, -1),
        },
        { suppressApiIssueLogging: true },
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not reach the assistant. Please try again.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, hindi ako makasagot ngayon. Pwede mo i-scroll ang Contact section sa baba o i-email ang team directly.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">
      {isOpen ? (
        <div
          role="dialog"
          aria-label="QuickPawn assistant chat"
          className="flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-brand-green/15 bg-white shadow-2xl shadow-brand-green/20"
        >
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-green to-brand-green px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{BRAND_CONFIG.shortCompanyName} Assistant</p>
              <p className="text-[10px] font-medium text-white/75">Powered by AI</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="max-h-[min(50vh,420px)] min-h-[280px] overflow-y-auto bg-[#f8f7f4] px-3 py-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "rounded-br-md bg-brand-green text-white"
                        : "rounded-bl-md border border-brand-green/10 bg-white text-zinc-700 shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSending ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-brand-green/10 bg-white px-3.5 py-2.5 text-[13px] text-zinc-500 shadow-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-green [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-green [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-green [animation-delay:240ms]" />
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-zinc-100 bg-white px-3 py-3">
            {error ? (
              <p className="mb-2 text-[10px] font-medium text-red-600">{error}</p>
            ) : null}

            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isSending}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-brand-green/15 bg-brand-green/5 px-2.5 py-1 text-[10px] font-bold text-brand-green transition hover:bg-brand-green/10 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                disabled={isSending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Type your question..."
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-brand-green focus:bg-white disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>

            {onScrollToContact ? (
              <button
                type="button"
                onClick={onScrollToContact}
                className="mt-2 w-full text-center text-[10px] font-bold text-brand-green/70 transition hover:text-brand-green"
              >
                Need a human? Go to Contact →
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close QuickPawn assistant" : "Open QuickPawn assistant"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-xl shadow-brand-green/30 transition hover:scale-105 hover:brightness-110"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
