export type MessageRole = "user" | "assistant" | "system";

export type MessageAgentType =
  | "discovery"
  | "process_manager"
  | "tool"
  | "mapping"
  | "meditation"
  | "emdr";

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  agentType?: MessageAgentType;
  toolId?: string;
  timestamp: string;
}
