"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { MeditationPlayer } from "@/components/chat/MeditationPlayer";
import { MessageList } from "@/components/chat/MessageList";
import { BeliefStrengthSelector } from "@/components/beliefs/BeliefStrengthSelector";
import { useChat } from "@/hooks/useChat";
import { useSessionStore } from "@/stores/useSessionStore";
import { useBeliefStore } from "@/stores/useBeliefStore";
import { getToolById } from "@/lib/prompts/tools";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

const phaseLabels: Record<string, string> = {
  discovery: "שלב זיהוי האמונה",
  belief_strength_selection: "דירוג עוצמת האמונה",
  tool_selection: "בחירת כלי טיפולי...",
  tool_execution: "שלב שחרור האמונה",
  meditation: "דימיון מודרך",
  completed: "התהליך הושלם",
};

export default function ReleaseSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { messages, isStreaming, sendMessage, session } = useChat(sessionId);
  const updateSession = useSessionStore((s) => s.updateSession);
  const updateBelief = useBeliefStore((s) => s.updateBelief);
  const initialGreetingTriggered = useRef(false);
  const toolSelectionTriggered = useRef(false);
  const toolExecutionTriggered = useRef(false);

  // Handle belief strength selection
  const handleStrengthSelect = (strength: number) => {
    if (session && session.beliefId) {
      updateBelief(session.beliefId, { initialStrength: strength });
    }
    updateSession(sessionId, { phase: "tool_selection" });
  };

  // Handle meditation completion
  const handleMeditationComplete = () => {
    updateSession(sessionId, { phase: "completed" });
  };

  // Send initial greeting when session starts with no messages
  useEffect(() => {
    if (session && messages.length === 0 && session.phase === "discovery" && !initialGreetingTriggered.current) {
      initialGreetingTriggered.current = true;
      sendMessage("היי, אני רוצה לעבוד על אמונה מגבילה");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Handle tool_selection phase - call process manager API
  useEffect(() => {
    if (
      session?.phase === "tool_selection" &&
      !isStreaming &&
      !toolSelectionTriggered.current
    ) {
      toolSelectionTriggered.current = true;
      const selectTool = async () => {
        try {
          const sessionMessages = messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const response = await fetch("/api/process-manager", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              belief: session.identifiedBelief || "",
              conversationHistory: sessionMessages,
              communicationStyle: session.communicationStyle,
            }),
          });

          const data = await response.json();
          const toolId = data.selectedToolId || "sleight_of_mouth";

          updateSession(sessionId, {
            phase: "tool_execution",
            currentToolId: toolId,
          });
        } catch {
          updateSession(sessionId, {
            phase: "tool_execution",
            currentToolId: "sleight_of_mouth",
          });
        }
      };
      selectTool();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase, isStreaming]);

  // Auto-send first message when tool_execution starts
  useEffect(() => {
    if (
      session?.phase === "tool_execution" &&
      session.currentToolId &&
      !isStreaming &&
      !toolExecutionTriggered.current
    ) {
      toolExecutionTriggered.current = true;
      sendMessage(
        `בוא נעבוד על האמונה: "${session.identifiedBelief}"`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase, session?.currentToolId, isStreaming]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentTool = session.currentToolId
    ? getToolById(session.currentToolId)
    : null;

  const phaseLabel =
    session.phase === "tool_execution" && currentTool
      ? `שחרור: ${currentTool.nameHe}`
      : phaseLabels[session.phase] || session.phase;

  // Show belief strength selector when appropriate
  if (session.phase === "belief_strength_selection" && session.identifiedBelief) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] p-4">
        <BeliefStrengthSelector
          belief={session.identifiedBelief}
          onSelect={handleStrengthSelect}
        />
      </div>
    );
  }

  // Show meditation player when belief is released
  if (session.phase === "meditation") {
    return (
      <div className="relative">
        {/* Phase indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="primary">{phaseLabels.meditation}</Badge>
        </div>

        <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto">
            <MessageList messages={messages} />
          </div>

          {/* Meditation player */}
          <div className="p-4 pb-[calc(1rem+3.5rem)] md:pb-4 border-t border-border-light">
            <MeditationPlayer
              oldBelief={session.identifiedBelief || ""}
              newBelief={session.newBelief || ""}
              insight={session.releaseInsight || ""}
              style={session.communicationStyle || "sensitive"}
              onComplete={handleMeditationComplete}
              storageKey={session.beliefId}
              onAudioSaved={() => {
                if (session.beliefId) {
                  updateBelief(session.beliefId, { meditationAudioSaved: true });
                }
              }}
            />
            <div className="text-center mt-3">
              <button
                onClick={handleMeditationComplete}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                דלג על הדימיון המודרך
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state during tool selection
  if (session.phase === "tool_selection") {
    return (
      <div className="relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="primary">{phaseLabel}</Badge>
        </div>
        <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
          <div className="flex-1 overflow-y-auto">
            <MessageList messages={messages} />
          </div>
          <div className="flex items-center justify-center p-4 gap-3 border-t border-border-light">
            <Spinner size="sm" />
            <span className="text-sm text-text-muted">מכין את הכלי הטיפולי המתאים...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatContainer
      messages={messages}
      isStreaming={isStreaming}
      onSend={sendMessage}
      header={
        <div className="flex justify-center py-3 shrink-0">
          <Badge variant={session.phase === "completed" ? "success" : "primary"}>
            {phaseLabel}
          </Badge>
        </div>
      }
    />
  );
}
