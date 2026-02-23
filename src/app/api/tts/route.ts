import { NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TTS_VOICE = "Algenib";
const SAMPLE_RATE = 24000;

function pcmToWav(pcmBuffer: Buffer): Buffer {
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);

  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Missing required field: text" },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          parts: [
            {
              text: `Read the following short sentence aloud in Hebrew, in a calm warm voice:\n\n${text}`,
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
    const wavBuffer = pcmToWav(pcmBuffer);

    return new Response(new Uint8Array(wavBuffer), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wavBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
