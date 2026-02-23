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

export function ChatContainer({
  messages,
  isStreaming,
  onSend,
}: ChatContainerProps) {
  const [bottomOffset, setBottomOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    const messageList = containerRef.current.querySelector("[data-message-list]");
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, []);

  const syncViewport = useCallback(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    // Calculate how much the keyboard pushes up from the bottom
    const offset = window.innerHeight - vv.height - vv.offsetTop;
    setBottomOffset(Math.max(0, offset));
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    vv.addEventListener("resize", syncViewport);
    vv.addEventListener("scroll", syncViewport);
    return () => {
      vv.removeEventListener("resize", syncViewport);
      vv.removeEventListener("scroll", syncViewport);
    };
  }, [syncViewport]);

  // When bottomOffset changes, scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [bottomOffset, scrollToBottom]);

  // On focus: poll to catch keyboard animation
  const handleFocusIn = useCallback(() => {
    pollTimersRef.current.forEach(clearTimeout);
    pollTimersRef.current = [];

    const delays = [50, 100, 150, 200, 250, 300, 400, 500];
    for (const delay of delays) {
      pollTimersRef.current.push(setTimeout(syncViewport, delay));
    }
  }, [syncViewport]);

  useEffect(() => {
    return () => {
      pollTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 flex flex-col overflow-hidden"
      style={{
        top: "56px",
        bottom: `${bottomOffset}px`,
      }}
      onFocus={handleFocusIn}
    >
      <MessageList messages={messages} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
