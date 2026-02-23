"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useBeliefStore } from "@/stores/useBeliefStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { lifeAreas } from "@/lib/prompts/mapping";
import type { BeliefStatus } from "@/types/belief";
import type { CommunicationStyle } from "@/types/session";
import { getAudio } from "@/lib/audioStorage";

const statusLabels: Record<BeliefStatus, string> = {
  identifying: "מזהה...",
  identified: "זוהתה",
  processing: "בעבודה",
  released: "שוחררה",
  revisit: "לחזור אליה",
};

const statusVariants: Record<BeliefStatus, "default" | "success" | "warning" | "error" | "primary"> = {
  identifying: "default",
  identified: "primary",
  processing: "warning",
  released: "success",
  revisit: "error",
};

const areaLabels: Record<string, string> = {};
for (const area of lifeAreas) {
  areaLabels[area.id] = area.nameHe;
}

const filterOptions: { value: string; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "identified", label: "זוהתה" },
  { value: "processing", label: "בעבודה" },
  { value: "released", label: "שוחררה" },
  { value: "revisit", label: "לחזור" },
];

const styles: { id: CommunicationStyle; label: string; icon: string }[] = [
  { id: "sensitive", label: "רגיש", icon: "💜" },
  { id: "practical", label: "פרקטי", icon: "🎯" },
  { id: "spiritual", label: "רוחני", icon: "✨" },
  { id: "provocative", label: "פרובוקטיבי", icon: "🔥" },
];

export default function JournalPage() {
  const router = useRouter();
  const beliefs = useBeliefStore((s) => s.beliefs);
  const createSession = useSessionStore((s) => s.createSession);
  const updateSession = useSessionStore((s) => s.updateSession);
  const updateBelief = useBeliefStore((s) => s.updateBelief);

  const [statusFilter, setStatusFilter] = useState("all");
  const [stylePickBelief, setStylePickBelief] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBeliefText, setNewBeliefText] = useState("");
  const addBelief = useBeliefStore((s) => s.addBelief);

  // Meditation audio playback state
  const [playingBeliefId, setPlayingBeliefId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const handlePlayMeditation = useCallback(async (beliefId: string) => {
    // If already playing this belief, toggle pause/play
    if (playingBeliefId === beliefId && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
        setPlayingBeliefId(null);
      }
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setAudioLoading(true);
    try {
      const blob = await getAudio(beliefId);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("ended", () => setPlayingBeliefId(null));
      await audio.play();
      setPlayingBeliefId(beliefId);
    } catch {
      // Silently fail
    } finally {
      setAudioLoading(false);
    }
  }, [playingBeliefId]);

  const handleAddBelief = () => {
    if (!newBeliefText.trim()) return;
    addBelief({
      sessionId: "",
      beliefText: newBeliefText.trim(),
      status: "identified",
    });
    setNewBeliefText("");
    setShowAddForm(false);
  };

  const filteredBeliefs =
    statusFilter === "all"
      ? beliefs
      : beliefs.filter((b) => b.status === statusFilter);

  const handleWorkOnBelief = (beliefId: string, style: CommunicationStyle) => {
    const belief = beliefs.find((b) => b.id === beliefId);
    if (!belief) return;

    // Create session that skips discovery - goes straight to belief strength selection
    const sessionId = createSession("release", style);
    updateSession(sessionId, {
      phase: "belief_strength_selection",
      beliefId: belief.id,
      identifiedBelief: belief.beliefText,
    });
    updateBelief(beliefId, { status: "processing" });

    router.push(`/release/${sessionId}`);
  };

  return (
    <PageContainer>
      <div className="pt-6 pb-4">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
          יומן תובנות
        </h1>
        <p className="text-text-secondary text-sm">
          כל האמונות המגבילות שזוהו
        </p>
      </div>

      {/* Add belief form */}
      {showAddForm ? (
        <Card className="p-4 mb-4">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-text-secondary" dir="rtl">
              הזן אמונה מגבילה שזיהית
            </label>
            <input
              type="text"
              value={newBeliefText}
              onChange={(e) => setNewBeliefText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBelief()}
              placeholder='למשל: "אני לא מספיק טוב"'
              dir="rtl"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-white text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setShowAddForm(false); setNewBeliefText(""); }}
              >
                ביטול
              </Button>
              <Button
                size="sm"
                onClick={handleAddBelief}
                disabled={!newBeliefText.trim()}
              >
                הוסף
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-4 py-3 rounded-xl border-2 border-dashed border-border-light hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-text-muted hover:text-primary cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">הוסף אמונה מגבילה</span>
        </button>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              statusFilter === option.value
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Beliefs list */}
      {filteredBeliefs.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg mb-2">אין אמונות להצגה</p>
          <p className="text-sm">
            {statusFilter === "all"
              ? "התחל תהליך זיהוי כדי למלא את היומן"
              : "אין אמונות בסטטוס זה"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBeliefs.map((belief) => (
            <Card key={belief.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium mb-2 leading-relaxed">
                    &ldquo;{belief.beliefText}&rdquo;
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={statusVariants[belief.status]}>
                      {statusLabels[belief.status]}
                    </Badge>
                    {belief.area && (
                      <Badge variant="default">
                        {areaLabels[belief.area] || belief.area}
                      </Badge>
                    )}
                    <span className="text-xs text-text-muted">
                      {new Date(belief.discoveredAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                  {belief.status === "released" && belief.meditationAudioSaved && (
                    <button
                      onClick={() => handlePlayMeditation(belief.id)}
                      disabled={audioLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-lightest text-primary text-sm font-medium hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      {playingBeliefId === belief.id ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                          השהה
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          דימיון מודרך
                        </>
                      )}
                    </button>
                  )}
                  {belief.status !== "released" && (
                    <>
                      {stylePickBelief === belief.id ? (
                        <div className="flex gap-1">
                          {styles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => handleWorkOnBelief(belief.id, style.id)}
                              title={style.label}
                              className="w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors text-lg cursor-pointer"
                            >
                              {style.icon}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setStylePickBelief(belief.id)}
                        >
                          עבוד על אמונה זו
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {beliefs.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-primary">{beliefs.length}</p>
            <p className="text-xs text-text-muted">סה&quot;כ אמונות</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-green-600">
              {beliefs.filter((b) => b.status === "released").length}
            </p>
            <p className="text-xs text-text-muted">שוחררו</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-amber-600">
              {beliefs.filter((b) => b.status === "processing" || b.status === "identified").length}
            </p>
            <p className="text-xs text-text-muted">בעבודה</p>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
