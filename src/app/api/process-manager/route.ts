import { NextResponse } from "next/server";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { buildProcessManagerPrompt } from "@/lib/prompts/processManager";

export async function POST(request: Request) {
  const { belief, conversationHistory, communicationStyle } =
    await request.json();

  const prompt = buildProcessManagerPrompt(belief, communicationStyle);

  const historyText = conversationHistory
    .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `${prompt}\n\nהיסטוריית השיחה:\n${historyText}` }],
        },
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    }

    return NextResponse.json({
      selectedToolId: "sleight_of_mouth",
      reasoning: "ברירת מחדל - זריזות לשון",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
