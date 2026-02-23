"use client";

import { useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      setViewportHeight(vv.height);
    };

    // Initial set
    update();

    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  // When viewport changes (keyboard opens/closes), scroll to bottom
  useEffect(() => {
    if (viewportHeight && containerRef.current) {
      const messageList = containerRef.current.querySelector("[data-message-list]");
      if (messageList) {
        messageList.scrollTop = messageList.scrollHeight;
      }
    }
  }, [viewportHeight]);

  // On mobile, use visualViewport height minus header (56px)
  // On desktop, use calc(100vh - 64px)
  const mobileHeight = viewportHeight ? `${viewportHeight - 56}px` : "calc(100dvh - 56px)";

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden"
      style={{
        height: mobileHeight,
      }}
    >
      <MessageList messages={messages} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
