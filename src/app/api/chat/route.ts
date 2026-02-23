import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { createSSEStream } from "@/lib/stream";

export async function POST(request: Request) {
  const { messages, systemPrompt } = await request.json();

  // Filter out empty messages and ensure no consecutive same-role messages
  const filtered: { role: string; content: string }[] = [];
  for (const m of messages) {
    if (!m.content?.trim()) continue;
    const role = m.role === "assistant" ? "model" : "user";
    // Skip consecutive same-role messages by merging them
    if (filtered.length > 0 && filtered[filtered.length - 1].role === role) {
      filtered[filtered.length - 1].content += "\n" + m.content;
    } else {
      filtered.push({ role, content: m.content });
    }
  }

  // Gemini requires conversation to start with user
  if (filtered.length > 0 && filtered[0].role === "model") {
    filtered.shift();
  }

  const contents = filtered.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const stream = createSSEStream(async () => {
    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response;
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
