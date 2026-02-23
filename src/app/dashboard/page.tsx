"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { useBeliefStore } from "@/stores/useBeliefStore";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BeliefStatus } from "@/types/belief";

const phaseLabels: Record<string, string> = {
  wheel: "גלגל חיים",
  wheel_chat: "חקירת תחום",
  discovery: "זיהוי אמונה",
  tool_selection: "בחירת כלי",
  tool_execution: "שחרור",
  completed: "הושלם",
};

const sessionTypeLabels: Record<string, string> = {
  mapping: "מיפוי מערכת אמונות",
  release: "זיהוי ושחרור",
};

const sessionTypeIcons: Record<string, string> = {
  mapping: "\u{1F5FA}\uFE0F",
  release: "\u{1F513}",
};

const beliefStatusLabels: Record<BeliefStatus, string> = {
  identifying: "מזהה...",
  identified: "זוהתה",
  processing: "בעבודה",
  released: "שוחררה",
  revisit: "לחזור אליה",
};

const beliefStatusVariants: Record<
  BeliefStatus,
  "default" | "primary" | "warning" | "success" | "error"
> = {
  identifying: "default",
  identified: "primary",
  processing: "warning",
  released: "success",
  revisit: "error",
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function DashboardPage() {
  const router = useRouter();
  const sessions = useSessionStore((state) => state.sessions);
  const beliefs = useBeliefStore((state) => state.beliefs);
  const getStats = useBeliefStore((state) => state.getStats);

  const beliefStats = getStats();
  const totalSessions = sessions.length;
  const recentSessions = sessions.slice(0, 5);
  const recentBeliefs = beliefs.slice(0, 5);

  const stats = [
    {
      label: "סה\"כ פגישות",
      value: totalSessions,
      icon: "\u{1F4CB}",
      color: "text-primary",
      bgColor: "bg-primary-lightest",
    },
    {
      label: "אמונות שזוהו",
      value: beliefStats.total,
      icon: "\u{1F4A1}",
      color: "text-primary-dark",
      bgColor: "bg-primary-lightest",
    },
    {
      label: "אמונות ששוחררו",
      value: beliefStats.released,
      icon: "\u2728",
      color: "text-green",
      bgColor: "bg-green-light",
    },
    {
      label: "אמונות בעבודה",
      value: beliefStats.inProgress,
      icon: "\u{1F504}",
      color: "text-amber",
      bgColor: "bg-amber-light",
    },
  ];

  return (
    <PageContainer>
      <div dir="rtl" className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">לוח בקרה</h1>
          <p className="mt-1 text-sm text-text-secondary">
            סקירה כללית של המסע שלך
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bgColor}`}
              >
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-text-secondary">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Recent Sections Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Sessions */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              פגישות אחרונות
            </h2>
            {recentSessions.length === 0 ? (
              <Card className="py-10 text-center">
                <p className="text-text-muted">אין פגישות עדיין</p>
                <p className="mt-1 text-xs text-text-light">
                  התחל פגישה חדשה כדי להתחיל את המסע
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <Card
                    key={session.id}
                    hoverable
                    onClick={() => router.push(`/history/${session.id}`)}
                    className="flex items-center gap-4"
                  >
                    {/* Session Type Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-lightest">
                      <span className="text-lg">
                        {sessionTypeIcons[session.type]}
                      </span>
                    </div>

                    {/* Session Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">
                          {sessionTypeLabels[session.type]}
                        </p>
                        <Badge
                          variant={
                            session.phase === "completed" ? "success" : "default"
                          }
                        >
                          {phaseLabels[session.phase] || session.phase}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-text-muted">
                          {formatDate(session.createdAt)}
                        </p>
                        {session.type === "release" &&
                          session.communicationStyle && (
                            <span className="text-xs text-text-light">
                              ·{" "}
                              {session.communicationStyle === "sensitive"
                                ? "רגיש"
                                : session.communicationStyle === "practical"
                                  ? "פרקטי"
                                  : session.communicationStyle === "spiritual"
                                    ? "רוחני"
                                    : "פרובוקטיבי"}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <span className="shrink-0 text-text-light">&larr;</span>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Beliefs */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              אמונות אחרונות
            </h2>
            {recentBeliefs.length === 0 ? (
              <Card className="py-10 text-center">
                <p className="text-text-muted">אין אמונות עדיין</p>
                <p className="mt-1 text-xs text-text-light">
                  אמונות שיזוהו במהלך הפגישות יופיעו כאן
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentBeliefs.map((belief) => (
                  <Card key={belief.id} className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        belief.status === "released"
                          ? "bg-green"
                          : belief.status === "processing"
                            ? "bg-amber"
                            : belief.status === "revisit"
                              ? "bg-red"
                              : "bg-primary"
                      }`}
                    />

                    {/* Belief Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary">
                        {truncateText(belief.beliefText, 60)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={beliefStatusVariants[belief.status]}>
                          {beliefStatusLabels[belief.status]}
                        </Badge>
                        <span className="text-xs text-text-muted">
                          {formatDate(belief.discoveredAt)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
