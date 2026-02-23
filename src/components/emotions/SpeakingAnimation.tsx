"use client";

import { cn } from "@/lib/utils";

interface SpeakingAnimationProps {
  state: "idle" | "speaking" | "listening" | "connecting";
}

export function SpeakingAnimation({ state }: SpeakingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 flex-1">
      <div className="relative flex items-center justify-center">
        {/* Ambient glow */}
        <div
          className={cn(
            "absolute w-80 h-80 rounded-full blur-[80px] transition-opacity duration-1000",
            state === "speaking" && "opacity-70 animate-[glowPulse_2s_ease-in-out_infinite]",
            state === "listening" && "opacity-40 animate-[glowBreathe_3s_ease-in-out_infinite]",
            state === "idle" && "opacity-30 animate-[glowBreathe_5s_ease-in-out_infinite]",
            state === "connecting" && "opacity-20"
          )}
          style={{
            background: state === "listening"
              ? "radial-gradient(circle, rgba(239,68,68,0.4), rgba(168,85,247,0.2), transparent)"
              : "radial-gradient(circle, rgba(139,92,246,0.5), rgba(59,130,246,0.3), transparent)",
          }}
        />

        {/* Main orb */}
        <div
          className={cn(
            "relative w-48 h-48 rounded-full overflow-hidden",
            state === "idle" && "animate-[orbFloat_6s_ease-in-out_infinite]",
            state === "speaking" && "animate-[orbFloat_3s_ease-in-out_infinite]",
            state === "listening" && "animate-[orbFloat_4s_ease-in-out_infinite]",
            state === "connecting" && "animate-pulse"
          )}
        >
          {/* Gradient background that rotates */}
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              state === "connecting"
                ? "bg-gradient-to-br from-gray-300 to-gray-400"
                : "animate-[gradientSpin_8s_linear_infinite]"
            )}
            style={
              state !== "connecting"
                ? {
                    background:
                      state === "listening"
                        ? "conic-gradient(from 0deg, #ef4444, #a855f7, #ec4899, #f43f5e, #ef4444)"
                        : "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6, #a855f7, #8b5cf6)",
                  }
                : undefined
            }
          />

          {/* Inner blur overlay for softness */}
          <div className="absolute inset-[3px] rounded-full backdrop-blur-sm bg-white/5" />

          {/* Bright center glow */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-opacity duration-500",
              state === "speaking"
                ? "opacity-60 animate-[centerPulse_1.5s_ease-in-out_infinite]"
                : state === "listening"
                  ? "opacity-40"
                  : "opacity-30"
            )}
            style={{
              background:
                state === "listening"
                  ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5), rgba(244,63,94,0.2) 40%, transparent 70%)"
                  : "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.6), rgba(139,92,246,0.2) 40%, transparent 70%)",
            }}
          />

          {/* Highlight spot - moves around */}
          <div
            className={cn(
              "absolute w-20 h-20 rounded-full blur-xl",
              state === "speaking"
                ? "bg-white/40 animate-[highlightMove_3s_ease-in-out_infinite]"
                : state === "listening"
                  ? "bg-white/25 animate-[highlightMove_4s_ease-in-out_infinite]"
                  : "bg-white/20 animate-[highlightMove_6s_ease-in-out_infinite]"
            )}
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {state === "listening" ? (
              <svg
                className="w-10 h-10 text-white/90 drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : state === "speaking" ? (
              <div className="flex items-center gap-[5px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-white/90 rounded-full animate-[soundBar_0.5s_ease-in-out_infinite] drop-shadow-sm"
                    style={{
                      height: "18px",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            ) : state === "connecting" ? (
              <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : null}
          </div>
        </div>

        {/* Outer soft ring */}
        {state === "speaking" && (
          <div
            className="absolute w-56 h-56 rounded-full animate-[ringPulse_2s_ease-out_infinite]"
            style={{
              background: "radial-gradient(circle, transparent 60%, rgba(139,92,246,0.15) 80%, transparent 100%)",
            }}
          />
        )}
      </div>

      {/* Status text */}
      <p className="text-base text-text-muted font-light tracking-wide">
        {state === "idle" && "ממתין..."}
        {state === "speaking" && "מדבר..."}
        {state === "listening" && "מקשיב..."}
        {state === "connecting" && "מתחבר..."}
      </p>

      <style jsx>{`
        @keyframes gradientSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-4px); }
        }
        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes glowBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes centerPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes highlightMove {
          0%, 100% { top: 15%; left: 20%; }
          33% { top: 25%; left: 55%; }
          66% { top: 50%; left: 30%; }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.95); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes soundBar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(2); }
        }
      `}</style>
    </div>
  );
}
