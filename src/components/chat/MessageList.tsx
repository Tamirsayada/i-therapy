"use client";

import { useRef } from "react";
import type { Message } from "@/types/message";
import { MessageBubble } from "./MessageBubble";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollToBottom(containerRef, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <p>השיחה תתחיל כאן...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-message-list
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
