import type { CommunicationStyle } from "./session";

export interface ToolPromptParams {
  belief: string;
  communicationStyle: CommunicationStyle;
  conversationHistory: Array<{ role: string; content: string }>;
}

export interface TherapeuticTool {
  id: string;
  nameHe: string;
  nameEn: string;
  description: string;
  getSystemPrompt: (params: ToolPromptParams) => string;
}
