"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/client";
import type {
  Session,
  SessionType,
  CommunicationStyle,
} from "@/types/session";
import type { Message, MessageRole, MessageAgentType } from "@/types/message";

interface SessionState {
  sessions: Session[];
  messages: Record<string, Message[]>;
  activeSessionId: string | null;
  isStreaming: boolean;
  loaded: boolean;

  loadFromSupabase: () => Promise<void>;
  createSession: (type: SessionType, style?: CommunicationStyle) => string;
  updateSession: (id: string, updates: Partial<Session>) => void;
  setActiveSession: (id: string | null) => void;
  addMessage: (
    sessionId: string,
    message: {
      role: MessageRole;
      content: string;
      agentType?: MessageAgentType;
      toolId?: string;
    }
  ) => void;
  appendToLastMessage: (sessionId: string, chunk: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  getSessionMessages: (sessionId: string) => Message[];
  deleteSession: (id: string) => void;
}

// Helper: convert DB row to Session object
function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    type: row.type as SessionType,
    communicationStyle: row.communication_style as CommunicationStyle | undefined,
    phase: (row.phase as Session["phase"]) || "discovery",
    currentToolId: row.current_tool_id as string | undefined,
    beliefId: row.belief_id as string | undefined,
    identifiedBelief: row.identified_belief as string | undefined,
    wheelScores: row.wheel_scores as Record<string, number> | undefined,
    title: row.title as string | undefined,
    newBelief: row.new_belief as string | undefined,
    releaseInsight: row.release_insight as string | undefined,
    emotion: row.emotion as string | undefined,
    meditationAudioSaved: row.meditation_audio_saved as boolean | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Helper: convert DB row to Message object
function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    role: row.role as MessageRole,
    content: row.content as string,
    agentType: row.agent_type as MessageAgentType | undefined,
    toolId: row.tool_id as string | undefined,
    timestamp: row.created_at as string,
  };
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: [],
  messages: {},
  activeSessionId: null,
  isStreaming: false,
  loaded: false,

  loadFromSupabase: async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loaded: true });
        return;
      }

      // Load sessions
      const { data: sessionRows } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });

      const sessions = (sessionRows || []).map(rowToSession);

      // Load all messages for these sessions
      const sessionIds = sessions.map((s) => s.id);
      const messages: Record<string, Message[]> = {};

      if (sessionIds.length > 0) {
        const { data: messageRows } = await supabase
          .from("messages")
          .select("*")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: true });

        for (const row of messageRows || []) {
          const msg = rowToMessage(row);
          if (!messages[msg.sessionId]) messages[msg.sessionId] = [];
          messages[msg.sessionId].push(msg);
        }
      }

      // Initialize empty arrays for sessions without messages
      for (const s of sessions) {
        if (!messages[s.id]) messages[s.id] = [];
      }

      set({ sessions, messages, loaded: true });
    } catch (error) {
      console.error("Failed to load from Supabase:", error);
      set({ loaded: true });
    }
  },

  createSession: (type, style) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const session: Session = {
      id,
      type,
      communicationStyle: style,
      phase:
        type === "mapping"
          ? "wheel"
          : type === "emotions"
            ? "emotion_conversation"
            : "discovery",
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      sessions: [session, ...state.sessions],
      messages: { ...state.messages, [id]: [] },
      activeSessionId: id,
    }));

    // Persist to Supabase
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("sessions").insert({
        id,
        user_id: user.id,
        type,
        communication_style: style || null,
        phase: session.phase,
        created_at: now,
        updated_at: now,
      }).then(({ error }) => {
        if (error) console.error("Failed to save session:", error);
      });
    });

    return id;
  },

  updateSession: (id, updates) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      ),
    }));

    // Persist to Supabase
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.phase !== undefined) dbUpdates.phase = updates.phase;
    if (updates.communicationStyle !== undefined)
      dbUpdates.communication_style = updates.communicationStyle;
    if (updates.currentToolId !== undefined)
      dbUpdates.current_tool_id = updates.currentToolId;
    if (updates.beliefId !== undefined) dbUpdates.belief_id = updates.beliefId;
    if (updates.identifiedBelief !== undefined)
      dbUpdates.identified_belief = updates.identifiedBelief;
    if (updates.wheelScores !== undefined)
      dbUpdates.wheel_scores = updates.wheelScores;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.newBelief !== undefined) dbUpdates.new_belief = updates.newBelief;
    if (updates.releaseInsight !== undefined)
      dbUpdates.release_insight = updates.releaseInsight;
    if (updates.emotion !== undefined) dbUpdates.emotion = updates.emotion;
    if (updates.meditationAudioSaved !== undefined)
      dbUpdates.meditation_audio_saved = updates.meditationAudioSaved;

    const supabase = createClient();
    supabase
      .from("sessions")
      .update(dbUpdates)
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to update session:", error);
      });
  },

  setActiveSession: (id) => {
    set({ activeSessionId: id });
  },

  addMessage: (sessionId, { role, content, agentType, toolId }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const message: Message = {
      id,
      sessionId,
      role,
      content,
      agentType,
      toolId,
      timestamp: now,
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
    }));

    // Persist to Supabase
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("messages").insert({
        id,
        session_id: sessionId,
        user_id: user.id,
        role,
        content,
        agent_type: agentType || null,
        tool_id: toolId || null,
        created_at: now,
      }).then(({ error }) => {
        if (error) console.error("Failed to save message:", error);
      });
    });
  },

  appendToLastMessage: (sessionId, chunk) => {
    set((state) => {
      const msgs = state.messages[sessionId] || [];
      if (msgs.length === 0) return state;
      const lastMsg = msgs[msgs.length - 1];
      const updatedMsgs = [
        ...msgs.slice(0, -1),
        { ...lastMsg, content: lastMsg.content + chunk },
      ];
      return {
        messages: { ...state.messages, [sessionId]: updatedMsgs },
      };
    });

    // Debounced update to Supabase happens via the streaming completion
    // (the final message content is saved when streaming ends)
  },

  setStreaming: (isStreaming) => {
    // When streaming ends, persist the final message content to Supabase
    if (!isStreaming && get().isStreaming) {
      const activeId = get().activeSessionId;
      if (activeId) {
        const msgs = get().messages[activeId] || [];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg) {
          const supabase = createClient();
          supabase
            .from("messages")
            .update({ content: lastMsg.content })
            .eq("id", lastMsg.id)
            .then(({ error }) => {
              if (error) console.error("Failed to update streamed message:", error);
            });
        }
      }
    }
    set({ isStreaming });
  },

  getSessionMessages: (sessionId) => {
    return get().messages[sessionId] || [];
  },

  deleteSession: (id) => {
    set((state) => {
      const { [id]: _, ...restMessages } = state.messages;
      return {
        sessions: state.sessions.filter((s) => s.id !== id),
        messages: restMessages,
        activeSessionId:
          state.activeSessionId === id ? null : state.activeSessionId,
      };
    });

    // Delete from Supabase (cascade will delete messages)
    const supabase = createClient();
    supabase
      .from("sessions")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delete session:", error);
      });
  },
}));
