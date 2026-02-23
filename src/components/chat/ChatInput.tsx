"use client";

import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle mobile keyboard visibility using visualViewport API
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 0 ? offset : 0);
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  // Scroll textarea into view when focused on mobile
  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
  };

  return (
    <div
      className="border-t border-border-light bg-white p-3 md:p-4 md:pb-4"
      style={{
        paddingBottom: keyboardOffset > 0
          ? `${12}px`
          : `calc(0.75rem + 3.5rem)`,
        transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
        transition: "transform 0.1s ease-out",
      }}
    >
      <div className="flex items-end gap-2 md:gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder="כתוב הודעה..."
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-base md:text-sm",
            "placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary-light",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[44px] max-h-[120px]"
          )}
          style={{ direction: "rtl" }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer",
            "bg-primary text-white hover:bg-primary-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg
            className="w-5 h-5 rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
