import { NextResponse } from "next/server";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { buildMeditationScriptPrompt } from "@/lib/prompts/tools/meditation";
import type { CommunicationStyle } from "@/types/session";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TTS_VOICE = "Algenib";
const SAMPLE_RATE = 24000;

async function generateScript(
  oldBelief: string,
  newBelief: string,
  insight: string,
  style: CommunicationStyle
): Promise<string> {
  const prompt = buildMeditationScriptPrompt(oldBelief, newBelief, insight, style);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  return response.text ?? "";
}

function pcmToWav(pcmBuffer: Buffer): Buffer {
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF header
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  // fmt chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function textToSpeech(script: string): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [
      {
        parts: [
          {
            text: `Read the following guided meditation script aloud in Hebrew, in a calm, warm, and soothing therapeutic voice. Speak slowly with gentle pauses:\n\n${script}`,
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: TTS_VOICE,
          },
        },
      },
    },
  });

  const inlineData =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

  if (!inlineData?.data) {
    throw new Error("No audio data in TTS response");
  }

  const pcmBuffer = Buffer.from(inlineData.data, "base64");
  return pcmToWav(pcmBuffer);
}

export async function POST(request: Request) {
  try {
    const { oldBelief, newBelief, insight, style } = await request.json();

    if (!oldBelief || !newBelief || !style) {
      return NextResponse.json(
        { error: "Missing required fields: oldBelief, newBelief, style" },
        { status: 400 }
      );
    }

    // Step 1: Generate meditation script via Gemini
    const script = await generateScript(
      oldBelief,
      newBelief,
      insight || "",
      style as CommunicationStyle
    );

    // Step 2: Generate audio via Gemini TTS (Algenib voice)
    const wavBuffer = await textToSpeech(script);

    const body = new Uint8Array(wavBuffer);
    return new Response(body, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(body.byteLength),
      },
    });
  } catch (error) {
    console.error("Meditation generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
