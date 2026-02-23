"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface BilateralAnimationProps {
  duration?: number;
  onComplete: () => void;
  reminders?: { at5s: string; at18s: string } | null;
}

const BALL_RADIUS = 30;
const FAST_SPEED = 1260;
const SLOW_SPEED_MIN = 280;
const SLOW_SPEED_MAX = 532;

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Point {
  x: number;
  y: number;
}

interface Axis {
  a: Point;
  b: Point;
}

function getAxes(w: number, h: number): Axis[] {
  const R = BALL_RADIUS;
  return [
    { a: { x: R, y: R }, b: { x: w - R, y: h - R } },
    { a: { x: w - R, y: R }, b: { x: R, y: h - R } },
    { a: { x: R, y: R }, b: { x: w - R, y: R } },
    { a: { x: R, y: h / 2 }, b: { x: w - R, y: h / 2 } },
    { a: { x: R, y: h - R }, b: { x: w - R, y: h - R } },
  ];
}

function vecDir(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  return d < 0.001 ? { x: 1, y: 0 } : { x: dx / d, y: dy / d };
}

export function BilateralAnimation({
  duration = 35000,
  onComplete,
  reminders,
}: BilateralAnimationProps) {
  const ballRef = useRef<HTMLDivElement>(null);
  const [reminderText, setReminderText] = useState<string | null>(null);
  const firedTimesRef = useRef<Set<number>>(new Set());
  const remindersRef = useRef(reminders);
  remindersRef.current = reminders;

  const animate = useCallback(() => {
    const ball = ballRef.current;
    if (!ball) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    let axes = getAxes(w, h);
    let axisIdx = 0;
    let goingToB = true;
    const pos = { ...axes[0].a };
    let target = { ...axes[0].b };
    let dir = vecDir(pos, target);

    let isSlow = false;
    let currentSpeed = FAST_SPEED;
    let msUntilSlow = rand(1000, 4000);
    let slowAxisLocked = -1;

    function setTarget(ax: number, toB: boolean) {
      axisIdx = ax;
      goingToB = toB;
      target = toB ? { ...axes[ax].b } : { ...axes[ax].a };
      dir = vecDir(pos, target);
    }

    function tickSlow(deltaMs: number) {
      if (!isSlow) {
        msUntilSlow -= deltaMs;
        if (msUntilSlow <= 0) {
          isSlow = true;
          currentSpeed = rand(SLOW_SPEED_MIN, SLOW_SPEED_MAX);
          slowAxisLocked = axisIdx;
          ball!.classList.add("bilateral-slow");
        }
      }
    }

    function onAxisEnd() {
      if (isSlow && axisIdx === slowAxisLocked) {
        isSlow = false;
        currentSpeed = FAST_SPEED;
        slowAxisLocked = -1;
        ball!.classList.remove("bilateral-slow");
        msUntilSlow = rand(1000, 4000);
      }
    }

    function arriveAndPickNext() {
      onAxisEnd();
      pos.x = target.x;
      pos.y = target.y;
      axes = getAxes(window.innerWidth, window.innerHeight);

      const candidates: { i: number; toB: boolean }[] = [];
      axes.forEach((ax, i) => {
        const dA = Math.hypot(pos.x - ax.a.x, pos.y - ax.a.y);
        const dB = Math.hypot(pos.x - ax.b.x, pos.y - ax.b.y);
        if (dA < 12 && i !== axisIdx) candidates.push({ i, toB: true });
        if (dB < 12 && i !== axisIdx) candidates.push({ i, toB: false });
        if (dA < 12 && i === axisIdx) candidates.push({ i, toB: true });
        if (dB < 12 && i === axisIdx) candidates.push({ i, toB: false });
      });

      if (candidates.length === 0) {
        const i = (axisIdx + 1) % axes.length;
        pos.x = axes[i].a.x;
        pos.y = axes[i].a.y;
        setTarget(i, true);
      } else {
        const fresh = candidates.filter(
          (c) => !(c.i === axisIdx && c.toB === goingToB)
        );
        const chosen = pick(fresh.length ? fresh : candidates);
        setTarget(chosen.i, chosen.toB);
      }
    }

    setTarget(0, true);

    let startTs: number | null = null;
    let lastTs: number | null = null;
    let running = true;
    let rafId: number;

    function frame(ts: number) {
      if (!startTs) startTs = ts;
      if (!lastTs) lastTs = ts;

      const deltaMs = ts - lastTs;
      lastTs = ts;

      const elapsed = ts - startTs;

      // Fire time-based reminder text display (audio is handled by useGeminiLive via Web Audio API)
      const r = remindersRef.current;
      if (r) {
        if (elapsed >= 5000 && !firedTimesRef.current.has(5000)) {
          firedTimesRef.current.add(5000);
          if (r.at5s) {
            setReminderText(r.at5s);
            setTimeout(() => setReminderText(null), 5000);
          }
        }
        if (elapsed >= 18000 && !firedTimesRef.current.has(18000)) {
          firedTimesRef.current.add(18000);
          if (r.at18s) {
            setReminderText(r.at18s);
            setTimeout(() => setReminderText(null), 5000);
          }
        }
      }

      if (elapsed >= duration) {
        running = false;
        onComplete();
        return;
      }

      if (running) {
        tickSlow(deltaMs);

        let toMove = currentSpeed * (deltaMs / 1000);

        while (toMove > 0) {
          const dx = target.x - pos.x;
          const dy = target.y - pos.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (toMove >= d) {
            toMove -= d;
            arriveAndPickNext();
          } else {
            pos.x += dir.x * toMove;
            pos.y += dir.y * toMove;
            toMove = 0;
          }
        }
      }

      ball!.style.left = pos.x - BALL_RADIUS + "px";
      ball!.style.top = pos.y - BALL_RADIUS + "px";

      if (running) rafId = requestAnimationFrame(frame);
    }

    ball.style.left = pos.x - BALL_RADIUS + "px";
    ball.style.top = pos.y - BALL_RADIUS + "px";
    rafId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [duration, onComplete]);

  useEffect(() => {
    const cleanup = animate();
    return () => {
      cleanup?.();
    };
  }, [animate]);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden">
      <div
        ref={ballRef}
        className="absolute pointer-events-none"
        style={{
          width: BALL_RADIUS * 2,
          height: BALL_RADIUS * 2,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, #ff6666, #cc0000, #880000)",
          boxShadow: "0 4px 15px rgba(200,0,0,0.4)",
          transition: "box-shadow 0.15s, filter 0.15s",
        }}
      />

      {/* Reminder text overlay */}
      {reminderText && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div
            className="bg-black/60 text-white text-lg px-6 py-3 rounded-2xl text-center max-w-md animate-fade-in"
            dir="rtl"
          >
            {reminderText}
          </div>
        </div>
      )}

      <style jsx>{`
        .bilateral-slow {
          box-shadow: 0 2px 8px rgba(200, 0, 0, 0.25) !important;
          filter: brightness(0.8);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
