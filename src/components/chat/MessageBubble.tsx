"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";
import { StreamingDots } from "./StreamingDots";

interface MessageBubbleProps {
  message: Message;
}

function stripDisplayMarkers(text: string): string {
  return text
    .replace(/\[BELIEF_IDENTIFIED\]([\s\S]*?)\[\/BELIEF_IDENTIFIED\]/g, "$1")
    .replace(/\[BELIEF_CONFIRMED\]/g, "")
    .replace(/\[BELIEF_RELEASED\]/g, "")
    .replace(/\[NEW_BELIEF\][\s\S]*?\[\/NEW_BELIEF\]/g, "")
    .replace(/\[INSIGHT\][\s\S]*?\[\/INSIGHT\]/g, "")
    .trim();
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const displayContent = isUser ? message.content : stripDisplayMarkers(message.content);
  const isEmpty = displayContent.trim() === "";

  return (
    <div
      className={cn("flex", isUser ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white border border-border-light text-text-primary rounded-bl-sm shadow-sm"
        )}
      >
        {!isUser && isEmpty ? (
          <StreamingDots />
        ) : (
          <div className="whitespace-pre-wrap">{displayContent}</div>
        )}
      </div>
    </div>
  );
}
