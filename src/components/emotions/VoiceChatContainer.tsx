"use client";

import { SpeakingAnimation } from "./SpeakingAnimation";
import { BilateralAnimation } from "./BilateralAnimation";

interface VoiceChatContainerProps {
  connectionState: "disconnected" | "connecting" | "connected";
  isSpeaking: boolean;
  showBilateral: boolean;
  bilateralReminders: { at5s: string; at18s: string } | null;
  error: string | null;
  onBilateralComplete: () => void;
  onRetry: () => void;
}

export function VoiceChatContainer({
  connectionState,
  isSpeaking,
  showBilateral,
  bilateralReminders,
  error,
  onBilateralComplete,
  onRetry,
}: VoiceChatContainerProps) {
  const animState =
    connectionState === "connecting"
      ? "connecting"
      : isSpeaking
        ? "speaking"
        : connectionState === "connected"
          ? "listening"
          : "idle";

  return (
    <div className="flex flex-col h-full">
      {/* Bilateral animation overlay */}
      {showBilateral && (
        <BilateralAnimation
          onComplete={onBilateralComplete}
          reminders={bilateralReminders}
        />
      )}

      {/* Main visual - immersive orb */}
      <div className="flex-1 flex items-center justify-center">
        <SpeakingAnimation state={animState} />
      </div>

      {/* Bottom status bar */}
      <div className="flex-shrink-0 border-t border-border-light bg-white px-4 py-3 pb-[calc(0.75rem+3.5rem)] md:pb-3">
        <div className="max-w-2xl mx-auto text-center">
          {error ? (
            <div className="flex items-center justify-center gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={onRetry}
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
              >
                נסה שוב
              </button>
            </div>
          ) : connectionState === "connecting" ? (
            <p className="text-sm text-text-muted">מתחבר...</p>
          ) : connectionState === "connected" ? (
            <div className="flex items-center justify-center gap-2">
              {isSpeaking ? (
                <p className="text-sm text-text-secondary">המלווה מדבר...</p>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm text-text-secondary">
                    מקשיב... דבר כשתהיה מוכן
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">לא מחובר</p>
          )}
        </div>
      </div>
    </div>
  );
}
