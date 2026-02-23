"use client";

import { cn } from "@/lib/utils";

interface ScoreSelectorProps {
  areaName: string;
  currentScore: number;
  onScoreChange: (score: number) => void;
}

const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function ScoreSelector({
  areaName,
  currentScore,
  onScoreChange,
}: ScoreSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4" dir="rtl">
      <h3 className="text-lg font-semibold text-text-primary">{areaName}</h3>

      <div className="flex flex-row-reverse items-center gap-1.5 md:gap-2">
        {scores.map((score) => {
          const isSelected = score === currentScore;

          return (
            <button
              key={score}
              type="button"
              onClick={() => onScoreChange(score)}
              className={cn(
                "flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full text-xs md:text-sm font-medium",
                "transition-all duration-200 ease-in-out cursor-pointer",
                "hover:scale-110 active:scale-95",
                isSelected
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-text-secondary hover:bg-surface-hover"
              )}
              aria-label={`${areaName} - ${score}`}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}
