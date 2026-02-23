"use client";

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/stores/useSessionStore";
import { useBeliefStore } from "@/stores/useBeliefStore";

export function SupabaseDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadSessions = useSessionStore((s) => s.loadFromSupabase);
  const loadBeliefs = useBeliefStore((s) => s.loadFromSupabase);
  const sessionsLoaded = useSessionStore((s) => s.loaded);
  const beliefsLoaded = useBeliefStore((s) => s.loaded);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current || (sessionsLoaded && beliefsLoaded)) return;
    loadingRef.current = true;

    Promise.all([loadSessions(), loadBeliefs()]).finally(() => {
      loadingRef.current = false;
    });
  }, [loadSessions, loadBeliefs, sessionsLoaded, beliefsLoaded]);

  return <>{children}</>;
}
