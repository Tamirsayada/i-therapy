"use client";

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
  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] md:h-[calc(100vh-64px)]">
      <MessageList messages={messages} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
