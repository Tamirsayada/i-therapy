"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Message } from "@/types/message";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
  onSend: (content: string) => void;
}

const HEADER_HEIGHT = 56;
const MOBILE_NAV_HEIGHT = 56;

export function ChatContainer({
  messages,
  isStreaming,
  onSend,
}: ChatContainerProps) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialHeightRef = useRef(
    typeof window !== "undefined" ? window.innerHeight : 0
  );

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    const messageList =
      containerRef.current.querySelector("[data-message-list]");
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, []);

  // With interactive-widget=resizes-content, window.innerHeight shrinks
  // when keyboard opens. Compare to initial height to detect keyboard.
  const checkKeyboard = useCallback(() => {
    const heightDiff = initialHeightRef.current - window.innerHeight;
    setIsKeyboardOpen(heightDiff > 100);
  }, []);

  useEffect(() => {
    // Listen to resize events (triggered by keyboard on iOS with resizes-content)
    window.addEventListener("resize", checkKeyboard);

    // Also listen to visualViewport as backup
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", checkKeyboard);
    }

    return () => {
      window.removeEventListener("resize", checkKeyboard);
      if (vv) {
        vv.removeEventListener("resize", checkKeyboard);
      }
    };
  }, [checkKeyboard]);

  // Scroll to bottom when keyboard state changes
  useEffect(() => {
    scrollToBottom();
  }, [isKeyboardOpen, scrollToBottom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Bottom offset: when keyboard closed on mobile, leave room for nav bar.
  // When keyboard open, no nav offset needed (nav is hidden).
  const bottomOffset =
    !isKeyboardOpen && isMobile ? MOBILE_NAV_HEIGHT : 0;

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 flex flex-col overflow-hidden"
      style={{
        top: `${HEADER_HEIGHT}px`,
        bottom: `${bottomOffset}px`,
      }}
    >
      <MessageList messages={messages} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
