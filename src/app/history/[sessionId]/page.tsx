"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { MessageList } from "@/components/chat/MessageList";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  SessionPhase,
  SessionType,
  CommunicationStyle,
} from "@/types/session";

const phaseLabels: Record<SessionPhase, string> = {
  wheel: "גלגל חיים",
  wheel_chat: "חקירת תחום",
  discovery: "זיהוי אמונה",
  belief_strength_selection: "דירוג עוצמה",
  tool_selection: "בחירת כלי",
  tool_execution: "שחרור",
  emotion_conversation: "שחרור רגשות",
  meditation: "דימיון מודרך",
  completed: "הושלם",
};

const phaseVariants: Record<
  SessionPhase,
  "default" | "success" | "warning" | "primary"
> = {
  wheel: "default",
  wheel_chat: "default",
  discovery: "primary",
  belief_strength_selection: "primary",
  tool_selection: "warning",
  tool_execution: "warning",
  emotion_conversation: "primary",
  meditation: "primary",
  completed: "success",
};

const styleLabels: Record<CommunicationStyle, string> = {
  sensitive: "רגיש",
  practical: "פרקטי",
  spiritual: "רוחני",
  provocative: "פרובוקטיבי",
};

const typeLabels: Record<SessionType, string> = {
  mapping: "🗺️ מיפוי מערכת אמונות",
  release: "🔓 זיהוי ושחרור אמונה",
  emotions: "💜 שחרור רגשות ותחושות",
};

export default function HistorySessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { messages, isStreaming, sendMessage, session } = useChat(sessionId);

  if (!session) {
    return (
      <PageContainer narrow>
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg mb-4">השיחה לא נמצאה</p>
          <Button
            variant="secondary"
            onClick={() => router.push("/history")}
          >
            חזרה להיסטוריה
          </Button>
        </div>
      </PageContainer>
    );
  }

  const isCompleted = session.phase === "completed";
  const canChat =
    !isCompleted &&
    (session.phase === "discovery" ||
      session.phase === "tool_execution" ||
      session.phase === "wheel_chat");

  const sessionHeader = (
    <div className="border-b border-border-light bg-white shrink-0">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/history")}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            חזרה
          </button>

          <div className="flex gap-2 items-center flex-wrap justify-end">
            <Badge variant={phaseVariants[session.phase]}>
              {phaseLabels[session.phase]}
            </Badge>
            {session.communicationStyle && (
              <Badge variant="default">
                {styleLabels[session.communicationStyle]}
              </Badge>
            )}
          </div>
        </div>

        {session.identifiedBelief && (
          <p className="text-text-secondary text-xs mt-2 leading-relaxed truncate">
            אמונה: &ldquo;{session.identifiedBelief}&rdquo;
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat area - with input if session is active */}
      {canChat ? (
        <ChatContainer
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          header={sessionHeader}
        />
      ) : (
        <>
          {sessionHeader}
          <div className="flex-1 overflow-hidden">
            <div className="max-w-3xl mx-auto h-full">
              <MessageList messages={messages} />
            </div>
          </div>
          <div className="border-t border-border-light bg-surface shrink-0">
            <div className="max-w-3xl mx-auto px-4 py-3 text-center">
              <p className="text-sm text-text-muted">
                {isCompleted ? "התהליך הושלם" : "שיחה לקריאה בלבד"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
