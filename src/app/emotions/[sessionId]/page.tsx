"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { VoiceChatContainer } from "@/components/emotions/VoiceChatContainer";
import { MeditationPlayer } from "@/components/chat/MeditationPlayer";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { useSessionStore } from "@/stores/useSessionStore";
import { Spinner } from "@/components/ui/Spinner";
import type { CommunicationStyle } from "@/types/session";

export default function EmotionSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const sessions = useSessionStore((s) => s.sessions);
  const updateSession = useSessionStore((s) => s.updateSession);
  const session = sessions.find((s) => s.id === sessionId);
  const connectTriggered = useRef(false);

  const {
    connectionState,
    isSpeaking,
    showBilateral,
    bilateralReminders,
    error,
    connect,
    disconnect,
    handleBilateralComplete,
  } = useGeminiLive(sessionId);

  // Auto-connect when session loads
  useEffect(() => {
    if (
      session &&
      session.phase === "emotion_conversation" &&
      !connectTriggered.current &&
      session.communicationStyle
    ) {
      connectTriggered.current = true;
      connect(session.communicationStyle as CommunicationStyle);
    }
  }, [session, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const handleMeditationComplete = () => {
    updateSession(sessionId, { phase: "completed" });
  };

  const handleRetry = () => {
    if (session?.communicationStyle) {
      connectTriggered.current = false;
      connect(session.communicationStyle as CommunicationStyle);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Meditation phase
  if (session.phase === "meditation") {
    return (
      <div className="relative">
        <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] items-center justify-center">
          <div className="p-4 w-full max-w-md">
            <MeditationPlayer
              oldBelief={session.emotion || ""}
              newBelief={session.newBelief || ""}
              insight={session.releaseInsight || ""}
              style={session.communicationStyle || "sensitive"}
              onComplete={handleMeditationComplete}
              storageKey={sessionId}
              onAudioSaved={() => {
                updateSession(sessionId, { meditationAudioSaved: true });
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

  // Completed phase
  if (session.phase === "completed") {
    return (
      <div className="relative">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] text-center px-4">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            כל הכבוד!
          </h2>
          <p className="text-text-secondary max-w-md">
            סיימת את תהליך שחרור הרגשות. התחושות שעבדת עליהן עברו עיבוד
            ושחרור.
          </p>
        </div>
      </div>
    );
  }

  // Main voice conversation
  return (
    <div className="h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
      <VoiceChatContainer
        connectionState={connectionState}
        isSpeaking={isSpeaking}
        showBilateral={showBilateral}
        bilateralReminders={bilateralReminders}
        error={error}
        onBilateralComplete={handleBilateralComplete}
        onRetry={handleRetry}
      />
    </div>
  );
}
