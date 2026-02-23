"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSessionStore } from "@/stores/useSessionStore";
import type { CommunicationStyle } from "@/types/session";

export interface Transcript {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

type ConnectionState = "disconnected" | "connecting" | "connected";

export function useGeminiLive(sessionId: string) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [showBilateral, setShowBilateral] = useState(false);
  const [bilateralReminders, setBilateralReminders] = useState<{
    at5s: string;
    at18s: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bilateralReminderAudios, setBilateralReminderAudios] = useState<{
    at5s?: Blob;
    at18s?: Blob;
  }>({});

  const updateSession = useSessionStore((s) => s.updateSession);
  const addMessage = useSessionStore((s) => s.addMessage);

  // Refs for mutable state
  const sessionRef = useRef<unknown>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(
    null
  );
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const transcriptIdRef = useRef(0);
  const currentOutputTextRef = useRef("");
  const currentInputTextRef = useRef("");
  // Fix 5: Flag to suppress audio during bilateral animation
  const isBilateralRef = useRef(false);
  // Fix 2: Scheduled playback time for gapless audio
  const scheduledEndTimeRef = useRef(0);
  // Ref for disconnect to use in handleMessage without circular deps
  const disconnectRef = useRef<() => void>(() => {});
  // Fallback timer: auto-trigger bilateral if AI mentions the ball but doesn't call the function
  const bilateralFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents re-triggering bilateral after it has already completed once in this cycle
  const bilateralCompletedRef = useRef(false);
  // Pending bilateral: stores function call info, waits for audio to stop before showing
  const pendingBilateralRef = useRef<{
    toolCallId: string;
    reminders: { at5s: string; at18s: string };
  } | null>(null);
  // Polling interval: checks if audio is truly done playing before showing bilateral
  const bilateralPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Timestamp of last received audio chunk (used by polling to detect streaming gaps)
  const lastAudioChunkTimeRef = useRef(0);
  // Timers for playing TTS reminders at 5s and 18s during bilateral
  const reminderTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Ref to access latest bilateralReminderAudios state inside timers
  const bilateralReminderAudiosRef = useRef<{ at5s?: Blob; at18s?: Blob }>({});

  // Keep audios ref in sync with state
  useEffect(() => {
    bilateralReminderAudiosRef.current = bilateralReminderAudios;
  }, [bilateralReminderAudios]);

  // Last-resort fallback: browser speechSynthesis
  const speakWithSpeechSynthesis = useCallback((text: string) => {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "he-IL";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
      console.log("[Live] Speaking reminder via speechSynthesis fallback");
    } catch (err) {
      console.error("[Live] speechSynthesis fallback failed:", err);
    }
  }, []);

  // Play a TTS blob through the existing (unlocked) Web Audio API AudioContext
  // Falls back to speechSynthesis if Web Audio fails
  const playTTSBlob = useCallback(async (blob: Blob, fallbackText?: string) => {
    const ctx = audioContextRef.current;
    if (!ctx) {
      console.warn("[Live] No AudioContext available for TTS playback, trying speechSynthesis");
      if (fallbackText) speakWithSpeechSynthesis(fallbackText);
      return;
    }
    try {
      // Ensure AudioContext is not suspended (can happen after tab switch)
      if (ctx.state === "suspended") {
        console.log("[Live] AudioContext suspended, resuming...");
        await ctx.resume();
      }
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      console.log("[Live] Playing TTS reminder via Web Audio API, duration:", audioBuffer.duration.toFixed(1) + "s");
    } catch (err) {
      console.error("[Live] Failed to play TTS blob via Web Audio:", err);
      if (fallbackText) speakWithSpeechSynthesis(fallbackText);
    }
  }, []);

  // Fetch TTS audio for a short text (returns blob or null on error)
  const fetchTTS = useCallback(async (text: string): Promise<Blob | null> => {
    try {
      console.log("[Live] Fetching TTS for:", text);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        console.error("[Live] TTS fetch failed:", res.status, res.statusText);
        return null;
      }
      const blob = await res.blob();
      console.log("[Live] TTS blob received:", blob.size, "bytes, type:", blob.type);
      return blob;
    } catch (err) {
      console.error("[Live] TTS fetch error:", err);
      return null;
    }
  }, []);

  const getTranscriptId = useCallback(() => {
    transcriptIdRef.current += 1;
    return `t-${transcriptIdRef.current}`;
  }, []);

  // Convert Int16 PCM to Float32 for AudioContext playback
  const int16ToFloat32 = useCallback((int16Array: Int16Array): Float32Array => {
    const float32 = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32[i] = int16Array[i] / 32768;
    }
    return float32;
  }, []);

  // Actually show bilateral animation (called when polling confirms audio is truly done)
  const showBilateralNow = useCallback(() => {
    const pending = pendingBilateralRef.current;
    if (!pending || !sessionRef.current) return;
    pendingBilateralRef.current = null;

    // Stop polling
    if (bilateralPollRef.current) {
      clearInterval(bilateralPollRef.current);
      bilateralPollRef.current = null;
    }

    isBilateralRef.current = true;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    scheduledEndTimeRef.current = 0;
    setIsSpeaking(false);
    // Save transcript before bilateral
    if (currentOutputTextRef.current.trim()) {
      addMessage(sessionId, {
        role: "assistant",
        content: currentOutputTextRef.current.trim(),
        agentType: "emdr",
      });
      currentOutputTextRef.current = "";
    }
    setBilateralReminders(pending.reminders);
    setShowBilateral(true);

    // Schedule TTS reminder playback at 5s and 18s via the unlocked Web Audio API
    reminderTimersRef.current.forEach(clearTimeout);
    reminderTimersRef.current = [];

    const reminder5sText = pending.reminders.at5s;
    const reminder18sText = pending.reminders.at18s;

    const timer5s = setTimeout(() => {
      const audios = bilateralReminderAudiosRef.current;
      console.log("[Live] 5s reminder timer fired, blob available:", !!audios?.at5s);
      if (audios?.at5s) {
        playTTSBlob(audios.at5s, reminder5sText);
      } else {
        console.log("[Live] No TTS blob at 5s, using speechSynthesis");
        speakWithSpeechSynthesis(reminder5sText);
      }
    }, 5000);

    const timer18s = setTimeout(() => {
      const audios = bilateralReminderAudiosRef.current;
      console.log("[Live] 18s reminder timer fired, blob available:", !!audios?.at18s);
      if (audios?.at18s) {
        playTTSBlob(audios.at18s, reminder18sText);
      } else {
        console.log("[Live] No TTS blob at 18s, using speechSynthesis");
        speakWithSpeechSynthesis(reminder18sText);
      }
    }, 18000);

    reminderTimersRef.current = [timer5s, timer18s];
  }, [addMessage, sessionId, playTTSBlob]);

  // Start polling to detect when audio is truly done playing.
  // Requires BOTH: (1) all scheduled Web Audio buffers finished playing,
  // AND (2) no new audio chunk received for 1 second.
  const startBilateralPolling = useCallback(() => {
    // Clear any existing poll
    if (bilateralPollRef.current) {
      clearInterval(bilateralPollRef.current);
    }
    bilateralPollRef.current = setInterval(() => {
      if (!pendingBilateralRef.current) {
        clearInterval(bilateralPollRef.current!);
        bilateralPollRef.current = null;
        return;
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;

      const timeSinceLastChunk = Date.now() - lastAudioChunkTimeRef.current;
      const allScheduledAudioDone = ctx.currentTime >= scheduledEndTimeRef.current - 0.05;

      // Both conditions must be true: no recent chunks AND playback finished
      if (timeSinceLastChunk >= 1000 && allScheduledAudioDone) {
        showBilateralNow();
      }
    }, 250); // Check every 250ms
  }, [showBilateralNow]);

  // Improved audio playback: schedule all queued buffers ahead for truly gapless audio
  const playAudioQueue = useCallback(() => {
    if (isBilateralRef.current) return;

    const ctx = audioContextRef.current;
    if (!ctx || audioQueueRef.current.length === 0) return;

    setIsSpeaking(true);

    // Schedule all available chunks ahead of time
    while (audioQueueRef.current.length > 0) {
      const samples = audioQueueRef.current.shift()!;
      const buffer = ctx.createBuffer(1, samples.length, 24000);
      buffer.getChannelData(0).set(samples);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startAt = Math.max(scheduledEndTimeRef.current, now);
      source.start(startAt);
      scheduledEndTimeRef.current = startAt + buffer.duration;
    }
  }, []);

  // Handle incoming messages from Gemini Live
  const handleMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (message: any) => {
      // Debug: log tool calls and non-audio messages
      if (message.toolCall) {
        console.log("[Live] Tool call received:", JSON.stringify(message.toolCall));
      }
      if (message.toolCallCancellation) {
        console.log("[Live] Tool call cancelled:", JSON.stringify(message.toolCallCancellation));
      }

      // Audio output
      if (message.serverContent?.modelTurn?.parts) {
        // Fix 5: Skip audio during bilateral animation
        if (isBilateralRef.current) return;

        for (const part of message.serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            const binaryStr = atob(part.inlineData.data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const int16 = new Int16Array(bytes.buffer);
            const float32 = int16ToFloat32(int16);
            audioQueueRef.current.push(float32);
            playAudioQueue();

            // Track when the last audio chunk arrived (used by bilateral polling)
            lastAudioChunkTimeRef.current = Date.now();
          }
        }
      }

      // Turn complete
      if (message.serverContent?.turnComplete) {
        // During bilateral (already showing), just ignore turn completion
        if (isBilateralRef.current) return;

        // If bilateral is pending, don't handle turnComplete normally.
        // The polling will detect when audio playback is truly done.
        if (pendingBilateralRef.current) {
          return;
        }

        // Wait for scheduled audio to finish playing, then set speaking to false
        const ctx = audioContextRef.current;
        const waitMs = ctx
          ? Math.max(0, (scheduledEndTimeRef.current - ctx.currentTime) * 1000) + 200
          : 200;
        setTimeout(() => {
          setIsSpeaking(false);
          // Save completed output transcript as message
          if (currentOutputTextRef.current.trim()) {
            addMessage(sessionId, {
              role: "assistant",
              content: currentOutputTextRef.current.trim(),
              agentType: "emdr",
            });
            currentOutputTextRef.current = "";
          }
        }, waitMs);
      }

      // Output transcription
      if (message.serverContent?.outputTranscription?.text) {
        // Fix 5: Skip transcription during bilateral
        if (isBilateralRef.current) return;

        const text = message.serverContent.outputTranscription.text;
        currentOutputTextRef.current += text;

        // Fallback: detect bilateral keywords in transcription
        // If AI mentions the red ball but doesn't call the function after a long time, auto-trigger
        // Note: With the split step 7/8 flow, the AI mentions the ball in step 7 then waits for user
        // confirmation, so we use a longer timeout (30s) to avoid false triggers
        const fullOutput = currentOutputTextRef.current;
        if (
          !bilateralCompletedRef.current &&
          !isBilateralRef.current &&
          !pendingBilateralRef.current &&
          !bilateralFallbackTimerRef.current &&
          (fullOutput.includes("כדור אדום") || fullOutput.includes("עקוב אחרי"))
        ) {
          bilateralFallbackTimerRef.current = setTimeout(() => {
            // Only trigger if bilateral hasn't started, completed, or been requested via function call
            if (!isBilateralRef.current && !bilateralCompletedRef.current && !pendingBilateralRef.current) {
              console.log("[Live] Bilateral fallback: AI mentioned ball but didn't call function, auto-triggering");
              isBilateralRef.current = true;
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              scheduledEndTimeRef.current = 0;
              setIsSpeaking(false);
              setBilateralReminders({ at5s: "החזק את הזיכרון", at18s: "תמשיך לעקוב" });
              setShowBilateral(true);
            }
            bilateralFallbackTimerRef.current = null;
          }, 30000);
        }

        setTranscripts((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, text: last.text + text },
            ];
          }
          return [
            ...prev,
            {
              id: getTranscriptId(),
              role: "assistant",
              text,
              timestamp: new Date().toISOString(),
            },
          ];
        });
      }

      // Input transcription
      if (message.serverContent?.inputTranscription?.text) {
        const text = message.serverContent.inputTranscription.text;
        currentInputTextRef.current += text;

        setTranscripts((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "user") {
            return [
              ...prev.slice(0, -1),
              { ...last, text: last.text + text },
            ];
          }
          // Save previous input as message when new input starts
          if (currentInputTextRef.current === text && prev.length > 0) {
            const prevLast = prev[prev.length - 1];
            if (prevLast.role === "user" && prevLast.text.trim()) {
              addMessage(sessionId, {
                role: "user",
                content: prevLast.text.trim(),
              });
            }
          }
          return [
            ...prev,
            {
              id: getTranscriptId(),
              role: "user",
              text,
              timestamp: new Date().toISOString(),
            },
          ];
        });
      }

      // Tool calls (function calling)
      if (message.toolCall?.functionCalls) {
        for (const fc of message.toolCall.functionCalls) {
          if (fc.name === "start_bilateral_animation") {
            // Cancel fallback timer since function was called properly
            if (bilateralFallbackTimerRef.current) {
              clearTimeout(bilateralFallbackTimerRef.current);
              bilateralFallbackTimerRef.current = null;
            }
            // Reset completed flag (allows re-trigger on protocol loop back to step 7+8)
            bilateralCompletedRef.current = false;

            const reminder5s = (fc.args?.reminder_5s as string) || "";
            const reminder18s = (fc.args?.reminder_18s as string) || "";

            // Store tool call ID for later response
            if (sessionRef.current) {
              (sessionRef.current as Record<string, unknown>).__pendingToolCallId = fc.id;
            }

            // Pre-fetch TTS audio for reminders immediately (they'll be ready by the time we need them)
            console.log("[Live] Pre-fetching TTS for reminders:", { reminder5s, reminder18s });
            setBilateralReminderAudios({});
            Promise.all([
              reminder5s ? fetchTTS(reminder5s) : Promise.resolve(null),
              reminder18s ? fetchTTS(reminder18s) : Promise.resolve(null),
            ]).then(([blob5s, blob18s]) => {
              console.log("[Live] TTS fetch results:", { blob5s: !!blob5s, blob18s: !!blob18s });
              const audios: { at5s?: Blob; at18s?: Blob } = {};
              if (blob5s) audios.at5s = blob5s;
              if (blob18s) audios.at18s = blob18s;
              setBilateralReminderAudios(audios);
            });

            // DON'T block audio yet - the function call can arrive before all audio chunks.
            // Store as pending; polling will trigger bilateral when audio is truly done.
            pendingBilateralRef.current = {
              toolCallId: fc.id,
              reminders: { at5s: reminder5s, at18s: reminder18s },
            };
            // Initialize last chunk time so polling can track silence
            if (lastAudioChunkTimeRef.current === 0) {
              lastAudioChunkTimeRef.current = Date.now();
            }
            // Start polling to detect when all audio has finished playing
            startBilateralPolling();
          } else if (fc.name === "start_meditation") {
            const emotion = (fc.args?.emotion as string) || "";
            const newPerspective = (fc.args?.new_perspective as string) || "";
            const insight = (fc.args?.insight as string) || "";

            // Respond to tool call
            sendToolResponse(fc.id, fc.name, { success: true });

            // Wait for any remaining audio to finish, then disconnect and transition
            const ctx = audioContextRef.current;
            const waitMs = ctx
              ? Math.max(0, (scheduledEndTimeRef.current - ctx.currentTime) * 1000) + 3000
              : 3000;
            setTimeout(() => {
              disconnectRef.current();
              updateSession(sessionId, {
                phase: "meditation",
                emotion,
                newBelief: newPerspective,
                releaseInsight: insight,
              });
            }, waitMs);
          }
        }
      }
    },
    [
      int16ToFloat32,
      playAudioQueue,
      startBilateralPolling,
      showBilateralNow,
      fetchTTS,
      getTranscriptId,
      addMessage,
      sessionId,
      updateSession,
    ]
  );

  // Send tool response
  const sendToolResponse = useCallback(
    (id: string, name: string, response: Record<string, unknown>) => {
      const session = sessionRef.current as {
        sendToolResponse: (params: {
          functionResponses: {
            id: string;
            name: string;
            response: Record<string, unknown>;
          }[];
        }) => void;
      } | null;
      if (!session) return;

      session.sendToolResponse({
        functionResponses: [{ id, name, response }],
      });
    },
    []
  );


  // Handle bilateral animation complete
  const handleBilateralComplete = useCallback(() => {
    // Mark bilateral as completed to prevent re-triggering from fallback
    bilateralCompletedRef.current = true;

    // Clear reminder timers
    reminderTimersRef.current.forEach(clearTimeout);
    reminderTimersRef.current = [];

    // Resume audio playback
    isBilateralRef.current = false;
    scheduledEndTimeRef.current = 0;

    setShowBilateral(false);
    setBilateralReminders(null);

    // Clear accumulated output text to prevent keyword re-detection
    currentOutputTextRef.current = "";

    // Respond to the pending tool call (if function was called by AI)
    const session = sessionRef.current as Record<string, unknown> | null;
    if (session?.__pendingToolCallId) {
      sendToolResponse(
        session.__pendingToolCallId as string,
        "start_bilateral_animation",
        {
          completed: true,
          duration_seconds: 35,
          instruction: "האנימציה הסתיימה. המשך מיד לשלב 9 - שבירה. שאל שאלה מפתיעה כמו: תגיד, אתה מריח פופקורן עכשיו?",
        }
      );
      delete session.__pendingToolCallId;
    } else if (session) {
      // Fallback case: bilateral was triggered by client-side detection
      // Send a text message to prompt the AI to continue to step 9 (break)
      (session as unknown as { sendClientContent: (params: { turns: { role: string; parts: { text: string }[] }[] }) => void }).sendClientContent({
        turns: [{ role: "user", parts: [{ text: "האנימציה של הכדור הסתיימה. המשך לשלב 9 - שבירה." }] }],
      });
    }
  }, [sendToolResponse]);

  // Connect to Gemini Live API
  const connect = useCallback(
    async (style: CommunicationStyle) => {
      try {
        setConnectionState("connecting");
        setError(null);

        // Get ephemeral token from our server
        const tokenRes = await fetch("/api/auth-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.json();
          throw new Error(err.error || "Failed to get auth token");
        }

        const { token } = await tokenRes.json();

        // Dynamic import to avoid SSR issues
        const { GoogleGenAI, Modality } = await import("@google/genai");

        // Create client with ephemeral token (v1alpha required for ephemeral tokens)
        const client = new GoogleGenAI({
          apiKey: token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        // Set up AudioContext for playback
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });

        // Fix 3: Minimal client config - voice & system instruction locked in token constraints
        const session = await client.live.connect({
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            responseModalities: [Modality.AUDIO],
          },
          callbacks: {
            onopen: () => {
              setConnectionState("connected");
            },
            onmessage: handleMessage,
            onerror: (e: ErrorEvent) => {
              console.error("Live API error:", e);
              setError(e.message || "Connection error");
              setConnectionState("disconnected");
            },
            onclose: () => {
              setConnectionState("disconnected");
            },
          },
        });

        sessionRef.current = session;

        // Send initial message to trigger AI to speak first
        (session as unknown as { sendClientContent: (params: { turns: { role: string; parts: { text: string }[] }[] }) => void }).sendClientContent({
          turns: [{ role: "user", parts: [{ text: "התחל את השיחה. הצג את עצמך ושאל את השאלה הראשונה." }] }],
        });

        // Start microphone capture
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = stream;

        // Use ScriptProcessorNode for PCM capture
        const micCtx = new AudioContext({ sampleRate: 16000 });
        micContextRef.current = micCtx;
        const source = micCtx.createMediaStreamSource(stream);
        const processor = micCtx.createScriptProcessor(8192, 1, 1);

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert float32 to int16
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Convert to base64
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          // Send to Gemini Live
          (
            session as {
              sendRealtimeInput: (params: {
                audio: { data: string; mimeType: string };
              }) => void;
            }
          ).sendRealtimeInput({
            audio: {
              data: base64,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        };

        source.connect(processor);
        processor.connect(micCtx.destination);
        workletNodeRef.current = processor;
      } catch (err) {
        console.error("Connection failed:", err);
        setError(err instanceof Error ? err.message : "Connection failed");
        setConnectionState("disconnected");
      }
    },
    [handleMessage]
  );

  // Disconnect
  const disconnect = useCallback(() => {
    // Clear bilateral fallback timer
    if (bilateralFallbackTimerRef.current) {
      clearTimeout(bilateralFallbackTimerRef.current);
      bilateralFallbackTimerRef.current = null;
    }

    // Stop microphone
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    // Disconnect worklet
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Close mic AudioContext
    if (micContextRef.current) {
      micContextRef.current.close();
      micContextRef.current = null;
    }

    // Close Live session
    if (sessionRef.current) {
      try {
        (sessionRef.current as { close: () => void }).close();
      } catch {
        // Ignore close errors
      }
      sessionRef.current = null;
    }

    // Close playback AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setConnectionState("disconnected");
    setIsSpeaking(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    scheduledEndTimeRef.current = 0;
    isBilateralRef.current = false;
    bilateralCompletedRef.current = false;
    pendingBilateralRef.current = null;
    lastAudioChunkTimeRef.current = 0;
    if (bilateralPollRef.current) {
      clearInterval(bilateralPollRef.current);
      bilateralPollRef.current = null;
    }
    reminderTimersRef.current.forEach(clearTimeout);
    reminderTimersRef.current = [];
  }, []);

  // Keep disconnect ref in sync
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectRef.current();
    };
  }, []);

  // Send a text message to the AI (for skip step, etc.)
  const sendTextMessage = useCallback((text: string) => {
    const session = sessionRef.current as unknown as {
      sendClientContent: (params: { turns: { role: string; parts: { text: string }[] }[] }) => void;
    } | null;
    if (!session) return;
    session.sendClientContent({
      turns: [{ role: "user", parts: [{ text }] }],
    });
  }, []);

  return {
    connectionState,
    isSpeaking,
    transcripts,
    showBilateral,
    bilateralReminders,
    error,
    connect,
    disconnect,
    handleBilateralComplete,
    sendTextMessage,
  };
}
