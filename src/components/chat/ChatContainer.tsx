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
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
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
    if (vv) {
      setViewportHeight(vv.height);
      scrollToBottom();
    }
  }, [scrollToBottom]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // Initial set
    setViewportHeight(vv.height);

    vv.addEventListener("resize", syncViewport);
    vv.addEventListener("scroll", syncViewport);
    return () => {
      vv.removeEventListener("resize", syncViewport);
      vv.removeEventListener("scroll", syncViewport);
    };
  }, [syncViewport]);

  // When viewport changes (keyboard opens/closes), scroll to bottom
  useEffect(() => {
    if (viewportHeight) {
      scrollToBottom();
    }
  }, [viewportHeight, scrollToBottom]);

  // On focus: poll with setTimeout delays to catch keyboard animation
  // iOS keyboard animation takes ~300ms, so check at multiple intervals
  const handleFocusIn = useCallback(() => {
    // Clear any existing poll timers
    pollTimersRef.current.forEach(clearTimeout);
    pollTimersRef.current = [];

    // Poll at multiple intervals during keyboard animation
    const delays = [50, 100, 150, 200, 250, 300, 400, 500];
    for (const delay of delays) {
      const timer = setTimeout(syncViewport, delay);
      pollTimersRef.current.push(timer);
    }
  }, [syncViewport]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      pollTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const mobileHeight = viewportHeight ? `${viewportHeight - 56}px` : "calc(100dvh - 56px)";

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden"
      style={{ height: mobileHeight }}
      onFocus={handleFocusIn}
    >
      <MessageList messages={messages} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
