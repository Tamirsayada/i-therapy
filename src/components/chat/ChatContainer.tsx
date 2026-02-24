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
const MOBILE_NAV_HEIGHT = 56; // h-14 bottom nav

export function ChatContainer({
  messages,
  isStreaming,
  onSend,
}: ChatContainerProps) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const initialHeight =
    typeof window !== "undefined"
      ? window.innerHeight - HEADER_HEIGHT - (isMobile ? MOBILE_NAV_HEIGHT : 0)
      : 600;

  const [containerHeight, setContainerHeight] = useState(initialHeight);
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

    // On iOS, visualViewport.height shrinks when keyboard opens
    // Use it directly to calculate available space
    const isKeyboardOpen = window.innerHeight - vv.height > 50;
    const navOffset = !isKeyboardOpen && isMobile ? MOBILE_NAV_HEIGHT : 0;

    // Container height = visual viewport height minus header minus nav (if visible)
    const height = vv.height - HEADER_HEIGHT - navOffset;
    setContainerHeight(Math.max(200, height));
    scrollToBottom();
  }, [scrollToBottom, isMobile]);

  useEffect(() => {
    // Initial sync
    syncViewport();

    const vv = window.visualViewport;
    if (!vv) return;

    vv.addEventListener("resize", syncViewport);
    vv.addEventListener("scroll", syncViewport);
    return () => {
      vv.removeEventListener("resize", syncViewport);
      vv.removeEventListener("scroll", syncViewport);
    };
  }, [syncViewport]);

  // When height changes, scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [containerHeight, scrollToBottom]);

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
        top: `${HEADER_HEIGHT}px`,
        height: `${containerHeight}px`,
      }}
      onFocus={handleFocusIn}
    >
      <MessageList messages={messages} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
