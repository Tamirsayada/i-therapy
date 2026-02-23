export type BeliefStatus =
  | "identifying"
  | "identified"
  | "processing"
  | "released"
  | "revisit";

export interface Belief {
  id: string;
  sessionId: string;
  beliefText: string;
  area?: string;
  status: BeliefStatus;
  discoveredAt: string;
  releasedAt?: string;
  toolUsed?: string;
  initialStrength?: number; // 1-10 rating of belief strength before treatment
  meditationAudioSaved?: boolean; // true when guided meditation audio is stored in IndexedDB
}
