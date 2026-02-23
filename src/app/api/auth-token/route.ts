import { NextResponse } from "next/server";
import { Modality, Type } from "@google/genai";
import { ai } from "@/lib/gemini";
import { buildEMDRPrompt } from "@/lib/prompts/emotions/emdr";
import type { CommunicationStyle } from "@/types/session";

const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const TTS_VOICE = "Algenib";

export async function POST(request: Request) {
  try {
    const { style } = await request.json();

    if (!style) {
      return NextResponse.json(
        { error: "Missing required field: style" },
        { status: 400 }
      );
    }

    const systemInstruction = buildEMDRPrompt(style as CommunicationStyle);

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(
      Date.now() + 2 * 60 * 1000
    ).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: TTS_VOICE,
                },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "start_bilateral_animation",
                    description:
                      "Start the bilateral eye movement animation (red ball) for 35 seconds. Call this when it's time for the bilateral stimulation step.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        reminder_5s: {
                          type: Type.STRING,
                          description:
                            "Short reminder to say at 5 seconds into the animation",
                        },
                        reminder_18s: {
                          type: Type.STRING,
                          description:
                            "Short reminder to say at 18 seconds into the animation",
                        },
                      },
                    },
                  },
                  {
                    name: "start_meditation",
                    description:
                      "Start generating a personalized guided meditation for the user. Call this when the user agrees to receive a guided meditation.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        emotion: {
                          type: Type.STRING,
                          description: "The original emotion that was processed",
                        },
                        new_perspective: {
                          type: Type.STRING,
                          description: "The new perspective gained from the process",
                        },
                        insight: {
                          type: Type.STRING,
                          description: "The key insight from the process",
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return NextResponse.json({ token: token.name });
  } catch (error) {
    console.error("Auth token creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
