"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { saveAudio } from "@/lib/audioStorage";

interface MeditationPlayerProps {
  oldBelief: string;
  newBelief: string;
  insight: string;
  style: string;
  onComplete?: () => void;
  storageKey?: string; // beliefId or sessionId — if provided, audio is persisted to IndexedDB
  onAudioSaved?: () => void; // called after audio is saved to IndexedDB
}

type MeditationState = "loading" | "ready" | "playing" | "paused" | "error";

export function MeditationPlayer({
  oldBelief,
  newBelief,
  insight,
  style,
  onComplete,
  storageKey,
  onAudioSaved,
}: MeditationPlayerProps) {
  const [state, setState] = useState<MeditationState>("loading");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const generatedRef = useRef(false);

  const generateMeditation = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const response = await fetch("/api/meditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldBelief, newBelief, insight, style }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `שגיאה ביצירת המדיטציה (${response.status})`
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      // Persist audio to IndexedDB if storageKey provided
      if (storageKey) {
        saveAudio(storageKey, blob).then(() => onAudioSaved?.()).catch(() => {});
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
        setState("ready");
      });

      audio.addEventListener("timeupdate", () => {
        setProgress(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setState("ready");
        setProgress(0);
        onComplete?.();
      });

      audio.addEventListener("error", () => {
        setState("error");
        setError("שגיאה בהשמעת המדיטציה");
      });
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "שגיאה ביצירת המדיטציה");
    }
  }, [oldBelief, newBelief, insight, style, onComplete, storageKey, onAudioSaved]);

  useEffect(() => {
    if (!generatedRef.current) {
      generatedRef.current = true;
      generateMeditation();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [generateMeditation]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (state === "playing") {
      audioRef.current.pause();
      setState("paused");
    } else {
      audioRef.current.play();
      setState("playing");
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-border-light shadow-sm max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="text-3xl mb-2">🧘</div>
        <h3 className="text-lg font-semibold text-text-primary">
          דימיון מודרך
        </h3>
        <p className="text-xs text-text-muted mt-1">
          הטמעת האמונה החדשה
        </p>
      </div>

      {/* New belief display */}
      {newBelief && (
        <div className="w-full text-center px-4 py-3 bg-primary-lightest rounded-2xl">
          <p className="text-sm font-medium text-primary-dark">
            &ldquo;{newBelief}&rdquo;
          </p>
        </div>
      )}

      {/* Loading state */}
      {state === "loading" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner size="lg" />
          <p className="text-sm text-text-secondary">
            יוצר דימיון מודרך מותאם אישית...
          </p>
          <p className="text-xs text-text-muted">
            זה עשוי לקחת כ-30 שניות
          </p>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => {
              generatedRef.current = false;
              generateMeditation();
            }}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* Player controls */}
      {(state === "ready" || state === "playing" || state === "paused") && (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              "bg-primary text-white hover:bg-primary-dark",
              "shadow-md hover:shadow-lg"
            )}
          >
            {state === "playing" ? (
              <svg
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 mr-[-2px]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Progress bar */}
          <div className="w-full px-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={progress}
              onChange={handleSeek}
              className="w-full h-1.5 rounded-full appearance-none bg-primary-lighter cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
