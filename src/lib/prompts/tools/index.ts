import type { TherapeuticTool, ToolPromptParams } from "@/types/tools";
import { buildSOMPrompt } from "./sleightOfMouth";
import { buildPartsPrompt } from "./partsIntegration";
import { buildMetaModelPrompt } from "./metaModel";

export const therapeuticTools: TherapeuticTool[] = [
  {
    id: "sleight_of_mouth",
    nameHe: "זריזות לשון",
    nameEn: "Sleight of Mouth",
    description: "14 תבניות לשוניות לפירוק אמונות מגבילות ויצירת נקודות מבט חדשות",
    getSystemPrompt: (params: ToolPromptParams) =>
      buildSOMPrompt(params.communicationStyle, params.belief),
  },
  {
    id: "parts_integration",
    nameHe: "אינטגרציית חלקים",
    nameEn: "Parts Integration",
    description: "תהליך איחוד חלקים מתנגשים בתוך האישיות למציאת הרמוניה פנימית",
    getSystemPrompt: (params: ToolPromptParams) =>
      buildPartsPrompt(params.communicationStyle, params.belief),
  },
  {
    id: "meta_model",
    nameHe: "מטא מודל",
    nameEn: "Meta Model",
    description: "שאלות מדויקות לחשיפת הכללות, השמטות ועיוותים במפה המנטלית",
    getSystemPrompt: (params: ToolPromptParams) =>
      buildMetaModelPrompt(params.communicationStyle, params.belief),
  },
];

export function getToolById(id: string): TherapeuticTool | undefined {
  return therapeuticTools.find((t) => t.id === id);
}
