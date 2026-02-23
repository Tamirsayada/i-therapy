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

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    const messageList = containerRef.current.querySelector("[data-message-list]");
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      setViewportHeight(vv.height);
    };

    // Initial set
    update();

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // When viewport changes (keyboard opens/closes), scroll to bottom
  useEffect(() => {
    if (viewportHeight) {
      scrollToBottom();
    }
  }, [viewportHeight, scrollToBottom]);

  // Also handle focus event on any input inside container
  // This catches the moment the user taps the input, before keyboard fully opens
  const handleFocusIn = useCallback(() => {
    // Poll for viewport changes during keyboard animation (300ms)
    const vv = window.visualViewport;
    if (!vv) return;

    let frame = 0;
    const poll = () => {
      setViewportHeight(vv.height);
      scrollToBottom();
      frame++;
      if (frame < 15) {
        requestAnimationFrame(poll);
      }
    };
    requestAnimationFrame(poll);
  }, [scrollToBottom]);

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
