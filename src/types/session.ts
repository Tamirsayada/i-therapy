export type CommunicationStyle =
  | "sensitive"
  | "practical"
  | "spiritual"
  | "provocative";

export type SessionType = "mapping" | "release" | "emotions";

export type SessionPhase =
  | "wheel"
  | "wheel_chat"
  | "discovery"
  | "belief_strength_selection"
  | "tool_selection"
  | "tool_execution"
  | "meditation"
  | "emotion_conversation"
  | "completed";

export interface Session {
  id: string;
  type: SessionType;
  communicationStyle?: CommunicationStyle;
  phase: SessionPhase;
  currentToolId?: string;
  beliefId?: string;
  identifiedBelief?: string;
  wheelScores?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  title?: string;
  newBelief?: string;
  releaseInsight?: string;
  emotion?: string;
  meditationAudioSaved?: boolean; // true when guided meditation audio is stored in IndexedDB
}
