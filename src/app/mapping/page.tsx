"use client";

import { useState, useEffect, useRef } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import LifeWheel from "@/components/mapping/LifeWheel";
import { ScoreSelector } from "@/components/mapping/ScoreSelector";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useSessionStore } from "@/stores/useSessionStore";
import { useChat } from "@/hooks/useChat";
import { lifeAreas } from "@/lib/prompts/mapping";

const areaNameMap: Record<string, string> = {};
for (const area of lifeAreas) {
  areaNameMap[area.id] = area.nameHe;
}

export default function MappingPage() {
  const createSession = useSessionStore((s) => s.createSession);
  const updateSession = useSessionStore((s) => s.updateSession);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const sessionCreated = useRef(false);

  // Create session on mount
  useEffect(() => {
    if (!sessionCreated.current) {
      sessionCreated.current = true;
      const id = createSession("mapping");
      setSessionId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return <MappingSession sessionId={sessionId} scores={scores} setScores={setScores} selectedArea={selectedArea} setSelectedArea={setSelectedArea} updateSession={updateSession} />;
}

function MappingSession({
  sessionId,
  scores,
  setScores,
  selectedArea,
  setSelectedArea,
  updateSession,
}: {
  sessionId: string;
  scores: Record<string, number>;
  setScores: (scores: Record<string, number>) => void;
  selectedArea: string | null;
  setSelectedArea: (area: string | null) => void;
  updateSession: (id: string, updates: Record<string, unknown>) => void;
}) {
  const { messages, isStreaming, sendMessage, session } = useChat(sessionId);
  const chatTriggered = useRef(false);

  const allScored = lifeAreas.every((area) => scores[area.id] !== undefined);

  const handleScoreChange = (score: number) => {
    if (!selectedArea) return;
    setScores({ ...scores, [selectedArea]: score });
  };

  const handleContinue = () => {
    if (!allScored) return;

    // Find lowest scored area
    let lowestArea: string = lifeAreas[0].id;
    let lowestScore = 11;
    for (const area of lifeAreas) {
      if ((scores[area.id] ?? 11) < lowestScore) {
        lowestScore = scores[area.id];
        lowestArea = area.id;
      }
    }

    updateSession(sessionId, {
      phase: "wheel_chat",
      wheelScores: scores,
    });

    setSelectedArea(lowestArea);
  };

  // Auto-trigger chat when entering wheel_chat phase
  useEffect(() => {
    if (
      session?.phase === "wheel_chat" &&
      messages.length === 0 &&
      !chatTriggered.current
    ) {
      chatTriggered.current = true;
      const lowestAreaName =
        lifeAreas.find((a) => a.id === selectedArea)?.nameHe || selectedArea;
      sendMessage(
        `מילאתי את גלגל החיים. התחום שהכי מציק לי הוא ${lowestAreaName}.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Chat phase
  if (session.phase === "wheel_chat") {
    return (
      <div className="relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="primary">
            חקירת תחום: {areaNameMap[selectedArea || ""] || ""}
          </Badge>
        </div>
        <ChatContainer
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
        />
      </div>
    );
  }

  // Wheel phase
  return (
    <PageContainer>
      <div className="text-center pt-6 pb-4">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
          גלגל החיים
        </h1>
        <p className="text-text-secondary text-sm">
          לחץ על כל תחום ודרג אותו מ-1 עד 10
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <LifeWheel
          scores={scores}
          onSelectArea={setSelectedArea}
          selectedArea={selectedArea}
        />

        {selectedArea && (
          <ScoreSelector
            areaName={areaNameMap[selectedArea] || selectedArea}
            currentScore={scores[selectedArea] || 0}
            onScoreChange={handleScoreChange}
          />
        )}

        {allScored && (
          <Button size="lg" onClick={handleContinue}>
            המשך לניתוח
          </Button>
        )}

        {!allScored && (
          <p className="text-text-muted text-xs">
            {Object.keys(scores).length} / {lifeAreas.length} תחומים דורגו
          </p>
        )}
      </div>
    </PageContainer>
  );
}
