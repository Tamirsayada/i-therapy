"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { SessionPhase, SessionType, CommunicationStyle } from "@/types/session";

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

const phaseVariants: Record<SessionPhase, "default" | "success" | "warning" | "primary"> = {
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

const typeIcons: Record<SessionType, string> = {
  mapping: "\uD83D\uDDFA\uFE0F",
  release: "\uD83D\uDD13",
  emotions: "\uD83D\uDC9C",
};

const typeTitles: Record<SessionType, string> = {
  mapping: "מיפוי מערכת אמונות",
  release: "זיהוי ושחרור אמונה",
  emotions: "שחרור רגשות ותחושות",
};

type FilterValue = "all" | "mapping" | "release" | "emotions";

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "mapping", label: "\uD83D\uDDFA\uFE0F מיפוי" },
  { value: "release", label: "\uD83D\uDD13 שחרור" },
  { value: "emotions", label: "\uD83D\uDC9C רגשות" },
];

export default function HistoryPage() {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);
  const [filter, setFilter] = useState<FilterValue>("all");

  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filter === "all") return sorted;
    return sorted.filter((s) => s.type === filter);
  }, [sessions, filter]);

  return (
    <PageContainer>
      <div className="pt-6 pb-4">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
          היסטוריית שיחות
        </h1>
        <p className="text-text-secondary text-sm">
          כל השיחות והתהליכים הקודמים שלך
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              filter === option.value
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">{filter === "mapping" ? "\uD83D\uDDFA\uFE0F" : filter === "release" ? "\uD83D\uDD13" : filter === "emotions" ? "\uD83D\uDC9C" : "\uD83D\uDCCB"}</p>
          <p className="text-lg mb-2">אין שיחות להצגה</p>
          <p className="text-sm">
            {filter === "all"
              ? "התחל תהליך חדש כדי לראות אותו כאן"
              : `אין שיחות ${filter === "mapping" ? "מיפוי" : filter === "release" ? "שחרור" : "רגשות"} עדיין`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              hoverable
              className="p-4"
              onClick={() => router.push(`/history/${session.id}`)}
            >
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-lightest to-primary-lighter flex items-center justify-center flex-shrink-0 text-lg">
                  {typeIcons[session.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-text-primary font-medium mb-1.5">
                    {session.title || typeTitles[session.type]}
                  </h3>

                  {/* Identified belief if exists */}
                  {session.identifiedBelief && (
                    <p className="text-text-secondary text-sm mb-2 truncate">
                      &ldquo;{session.identifiedBelief}&rdquo;
                    </p>
                  )}

                  {/* Badges row */}
                  <div className="flex gap-2 flex-wrap items-center">
                    <Badge variant={phaseVariants[session.phase]}>
                      {phaseLabels[session.phase]}
                    </Badge>

                    {session.communicationStyle && (
                      <Badge variant="default">
                        {styleLabels[session.communicationStyle]}
                      </Badge>
                    )}

                    <span className="text-xs text-text-muted">
                      {new Date(session.createdAt).toLocaleDateString("he-IL", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-text-muted self-center">
                  <svg
                    className="w-5 h-5 rotate-180"
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
