"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/client";
import type { Belief, BeliefStatus } from "@/types/belief";

interface BeliefState {
  beliefs: Belief[];
  loaded: boolean;

  loadFromSupabase: () => Promise<void>;
  addBelief: (belief: Omit<Belief, "id" | "discoveredAt">) => string;
  updateBelief: (id: string, updates: Partial<Belief>) => void;
  getBeliefsByStatus: (status: BeliefStatus) => Belief[];
  getBeliefForSession: (sessionId: string) => Belief | undefined;
  deleteBelief: (id: string) => void;
  getStats: () => { total: number; released: number; inProgress: number };
}

function rowToBelief(row: Record<string, unknown>): Belief {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    beliefText: row.belief_text as string,
    area: row.area as string | undefined,
    status: row.status as BeliefStatus,
    discoveredAt: row.discovered_at as string,
    releasedAt: row.released_at as string | undefined,
    toolUsed: row.tool_used as string | undefined,
    initialStrength: row.initial_strength as number | undefined,
    meditationAudioSaved: row.meditation_audio_saved as boolean | undefined,
  };
}

export const useBeliefStore = create<BeliefState>()((set, get) => ({
  beliefs: [],
  loaded: false,

  loadFromSupabase: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rows } = await supabase
      .from("beliefs")
      .select("*")
      .order("discovered_at", { ascending: false });

    set({ beliefs: (rows || []).map(rowToBelief), loaded: true });
  },

  addBelief: (belief) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newBelief: Belief = {
      ...belief,
      id,
      discoveredAt: now,
    };
    set((state) => ({
      beliefs: [newBelief, ...state.beliefs],
    }));

    // Persist to Supabase
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("beliefs").insert({
        id,
        session_id: belief.sessionId,
        user_id: user.id,
        belief_text: belief.beliefText,
        area: belief.area || null,
        status: belief.status,
        initial_strength: belief.initialStrength || null,
        tool_used: belief.toolUsed || null,
        meditation_audio_saved: belief.meditationAudioSaved || false,
        discovered_at: now,
      }).then(({ error }) => {
        if (error) console.error("Failed to save belief:", error);
      });
    });

    return id;
  },

  updateBelief: (id, updates) => {
    set((state) => ({
      beliefs: state.beliefs.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));

    // Persist to Supabase
    const dbUpdates: Record<string, unknown> = {};
    if (updates.beliefText !== undefined) dbUpdates.belief_text = updates.beliefText;
    if (updates.area !== undefined) dbUpdates.area = updates.area;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.initialStrength !== undefined)
      dbUpdates.initial_strength = updates.initialStrength;
    if (updates.toolUsed !== undefined) dbUpdates.tool_used = updates.toolUsed;
    if (updates.releasedAt !== undefined) dbUpdates.released_at = updates.releasedAt;
    if (updates.meditationAudioSaved !== undefined)
      dbUpdates.meditation_audio_saved = updates.meditationAudioSaved;

    if (Object.keys(dbUpdates).length > 0) {
      const supabase = createClient();
      supabase
        .from("beliefs")
        .update(dbUpdates)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Failed to update belief:", error);
        });
    }
  },

  getBeliefsByStatus: (status) => {
    return get().beliefs.filter((b) => b.status === status);
  },

  getBeliefForSession: (sessionId) => {
    return get().beliefs.find((b) => b.sessionId === sessionId);
  },

  deleteBelief: (id) => {
    set((state) => ({
      beliefs: state.beliefs.filter((b) => b.id !== id),
    }));

    const supabase = createClient();
    supabase
      .from("beliefs")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delete belief:", error);
      });
  },

  getStats: () => {
    const beliefs = get().beliefs;
    return {
      total: beliefs.length,
      released: beliefs.filter((b) => b.status === "released").length,
      inProgress: beliefs.filter(
        (b) => b.status === "processing" || b.status === "identified"
      ).length,
    };
  },
}));
