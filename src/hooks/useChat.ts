"use client";

import { useCallback } from "react";
import { useSessionStore } from "@/stores/useSessionStore";
import { useBeliefStore } from "@/stores/useBeliefStore";
import { buildDiscoveryPrompt } from "@/lib/prompts/discovery";
import { buildMappingPrompt } from "@/lib/prompts/mapping";
import { getToolById } from "@/lib/prompts/tools";
import type { MessageAgentType } from "@/types/message";
import type { CommunicationStyle } from "@/types/session";

function getSystemPrompt(
  phase: string,
  style?: CommunicationStyle,
  toolId?: string,
  belief?: string,
  wheelScores?: Record<string, number>
): string {
  if (phase === "discovery" && style) {
    return buildDiscoveryPrompt(style);
  }
  if (phase === "tool_execution" && toolId && style && belief) {
    const tool = getToolById(toolId);
    if (tool) {
      return tool.getSystemPrompt({
        communicationStyle: style,
        belief,
        conversationHistory: [],
      });
    }
  }
  if (phase === "wheel_chat" && wheelScores) {
    // Find lowest scored area
    let lowestArea = "confidence";
    let lowestScore = 11;
    for (const [area, score] of Object.entries(wheelScores)) {
      if (score < lowestScore) {
        lowestScore = score;
        lowestArea = area;
      }
    }
    return buildMappingPrompt(lowestArea, wheelScores);
  }
  return "אתה עוזר טיפולי. דבר בעברית.";
}

function getAgentType(phase: string): MessageAgentType {
  if (phase === "discovery") return "discovery";
  if (phase === "tool_execution") return "tool";
  if (phase === "wheel_chat") return "mapping";
  return "discovery";
}

const BELIEF_IDENTIFIED_REGEX =
  /\[BELIEF_IDENTIFIED\]([\s\S]*?)\[\/BELIEF_IDENTIFIED\]/g;
const BELIEF_CONFIRMED_MARKER = "[BELIEF_CONFIRMED]";
const BELIEF_RELEASED_MARKER = "[BELIEF_RELEASED]";
const NEW_BELIEF_REGEX = /\[NEW_BELIEF\]([\s\S]*?)\[\/NEW_BELIEF\]/;
const INSIGHT_REGEX = /\[INSIGHT\]([\s\S]*?)\[\/INSIGHT\]/;

function stripMarkers(text: string): string {
  return text
    .replace(BELIEF_IDENTIFIED_REGEX, "$1")
    .replace(BELIEF_CONFIRMED_MARKER, "")
    .replace(BELIEF_RELEASED_MARKER, "")
    .replace(NEW_BELIEF_REGEX, "")
    .replace(INSIGHT_REGEX, "")
    .trim();
}

export function useChat(sessionId: string) {
  const sessions = useSessionStore((s) => s.sessions);
  const messages = useSessionStore((s) => s.messages[sessionId] || []);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const addMessage = useSessionStore((s) => s.addMessage);
  const appendToLastMessage = useSessionStore((s) => s.appendToLastMessage);
  const setStreaming = useSessionStore((s) => s.setStreaming);
  const updateSession = useSessionStore((s) => s.updateSession);
  const addBelief = useBeliefStore((s) => s.addBelief);
  const updateBelief = useBeliefStore((s) => s.updateBelief);

  const session = sessions.find((s) => s.id === sessionId);

  const sendMessage = useCallback(
    async (content: string) => {
      // Read fresh session state from store to avoid stale closures
      const freshSession = useSessionStore
        .getState()
        .sessions.find((s) => s.id === sessionId);
      if (!freshSession || isStreaming) return;

      const agentType = getAgentType(freshSession.phase);

      // Add user message
      addMessage(sessionId, { role: "user", content });

      // Add empty assistant message for streaming
      addMessage(sessionId, {
        role: "assistant",
        content: "",
        agentType,
        toolId: freshSession.currentToolId,
      });

      setStreaming(true);

      try {
        const systemPrompt = getSystemPrompt(
          freshSession.phase,
          freshSession.communicationStyle as CommunicationStyle,
          freshSession.currentToolId,
          freshSession.identifiedBelief,
          freshSession.wheelScores
        );

        // Build message history for API (excluding the empty assistant message)
        const currentMessages = useSessionStore
          .getState()
          .getSessionMessages(sessionId);
        const apiMessages = currentMessages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            systemPrompt,
            sessionId,
            agentType,
          }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                appendToLastMessage(sessionId, data.content);
              } else if (data.type === "done") {
                fullContent = data.fullContent;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }

        // Process markers in the full content
        if (fullContent) {
          // Update the last message with cleaned content
          const state = useSessionStore.getState();
          const msgs = state.messages[sessionId] || [];
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            const cleanContent = stripMarkers(lastMsg.content);
            if (cleanContent !== lastMsg.content) {
              // Replace the last message content with cleaned version
              const updatedMsgs = [
                ...msgs.slice(0, -1),
                { ...lastMsg, content: cleanContent },
              ];
              useSessionStore.setState({
                messages: {
                  ...state.messages,
                  [sessionId]: updatedMsgs,
                },
              });
            }
          }

          // Check for belief identification
          const beliefMatch = fullContent.match(
            /\[BELIEF_IDENTIFIED\]([\s\S]*?)\[\/BELIEF_IDENTIFIED\]/
          );
          if (beliefMatch) {
            const beliefText = beliefMatch[1].trim();
            updateSession(sessionId, { identifiedBelief: beliefText });
          }

          // Check for belief confirmation
          if (fullContent.includes(BELIEF_CONFIRMED_MARKER)) {
            const currentSession = useSessionStore
              .getState()
              .sessions.find((s) => s.id === sessionId);
            const beliefText =
              currentSession?.identifiedBelief ||
              fullContent
                .match(
                  /\[BELIEF_IDENTIFIED\]([\s\S]*?)\[\/BELIEF_IDENTIFIED\]/
                )?.[1]
                ?.trim() ||
              "";

            if (beliefText) {
              const beliefId = addBelief({
                sessionId,
                beliefText,
                status: "identified",
              });
              updateSession(sessionId, {
                phase: "belief_strength_selection",
                beliefId,
                identifiedBelief: beliefText,
              });
            }
          }

          // Check for belief released
          if (fullContent.includes(BELIEF_RELEASED_MARKER)) {
            const currentSession = useSessionStore
              .getState()
              .sessions.find((s) => s.id === sessionId);

            // Extract new belief and insight from markers
            const newBeliefMatch = fullContent.match(NEW_BELIEF_REGEX);
            const newBelief = newBeliefMatch?.[1]?.trim() || "";

            const insightMatch = fullContent.match(INSIGHT_REGEX);
            const releaseInsight = insightMatch?.[1]?.trim() || "";

            // Update belief status to released
            if (currentSession?.beliefId) {
              updateBelief(currentSession.beliefId, {
                status: "released",
                releasedAt: new Date().toISOString(),
              });
            }

            // Transition to meditation phase after a delay so user can read the summary
            setTimeout(() => {
              updateSession(sessionId, {
                phase: "meditation",
                newBelief: newBelief || currentSession?.identifiedBelief || "",
                releaseInsight: releaseInsight || "שחרור מאמונה מגבילה",
              });
            }, 4000);
          }
        }
      } catch (error) {
        // Add error message
        const state = useSessionStore.getState();
        const msgs = state.messages[sessionId] || [];
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.role === "assistant" && lastMsg.content === "") {
            const updatedMsgs = [
              ...msgs.slice(0, -1),
              {
                ...lastMsg,
                content: `שגיאה: ${error instanceof Error ? error.message : "משהו השתבש"}`,
              },
            ];
            useSessionStore.setState({
              messages: { ...state.messages, [sessionId]: updatedMsgs },
            });
          }
        }
      } finally {
        setStreaming(false);
      }
    },
    [
      sessionId,
      isStreaming,
      addMessage,
      appendToLastMessage,
      setStreaming,
      updateSession,
      addBelief,
      updateBelief,
    ]
  );

  return { messages, isStreaming, sendMessage, session };
}
