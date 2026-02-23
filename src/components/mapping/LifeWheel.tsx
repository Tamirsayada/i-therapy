"use client";

import { cn } from "@/lib/utils";

interface LifeWheelProps {
  scores: Record<string, number>;
  onSelectArea: (areaId: string) => void;
  selectedArea: string | null;
}

const AREAS = [
  { id: "money", label: "כסף ופיננסים", color: "#918df6" },
  { id: "career", label: "קריירה ועבודה", color: "#7c9df6" },
  { id: "relationships", label: "זוגיות ואהבה", color: "#f67c8d" },
  { id: "family", label: "משפחה וחברים", color: "#f6a87c" },
  { id: "fitness", label: "בריאות וכושר", color: "#7cf6a8" },
  { id: "social", label: "חיי חברה ופנאי", color: "#f6e87c" },
  { id: "confidence", label: "ביטחון עצמי", color: "#b57cf6" },
] as const;

const CX = 200;
const CY = 200;
const OUTER_RADIUS = 180;
const MIN_RADIUS = 20;
const FILL_RANGE = OUTER_RADIUS - MIN_RADIUS; // 160
const SLICE_COUNT = AREAS.length;
const SLICE_ANGLE = (2 * Math.PI) / SLICE_COUNT;

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeWedge(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export default function LifeWheel({
  scores,
  onSelectArea,
  selectedArea,
}: LifeWheelProps) {
  // Start from -90 degrees (top of circle) so the first slice begins at 12 o'clock
  const startOffset = -Math.PI / 2;

  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("mx-auto select-none w-full max-w-[400px]")}
    >
      {/* Defs for glow filter and clip paths */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle
        cx={CX}
        cy={CY}
        r={OUTER_RADIUS}
        fill="none"
        stroke="#e2e0f9"
        strokeWidth={1}
        opacity={0.3}
      />

      {/* Render each area slice */}
      {AREAS.map((area, index) => {
        const score = scores[area.id] ?? 0;
        const clampedScore = Math.max(0, Math.min(10, score));
        const filledRadius = (clampedScore / 10) * FILL_RANGE + MIN_RADIUS;

        const sliceStart = startOffset + index * SLICE_ANGLE;
        const sliceEnd = startOffset + (index + 1) * SLICE_ANGLE;
        const midAngle = (sliceStart + sliceEnd) / 2;

        const isSelected = selectedArea === area.id;

        // Background wedge (full slice, faded)
        const bgPath = describeWedge(
          CX,
          CY,
          MIN_RADIUS,
          OUTER_RADIUS,
          sliceStart,
          sliceEnd
        );

        // Filled wedge (score-based)
        const filledPath = describeWedge(
          CX,
          CY,
          MIN_RADIUS,
          filledRadius,
          sliceStart,
          sliceEnd
        );

        // Selected highlight wedge (slightly larger)
        const highlightPath = isSelected
          ? describeWedge(
              CX,
              CY,
              MIN_RADIUS - 2,
              OUTER_RADIUS + 6,
              sliceStart,
              sliceEnd
            )
          : "";

        // Label position at ~60% of the radius from center
        const labelRadius = OUTER_RADIUS * 0.6;
        const labelPos = polarToCartesian(CX, CY, labelRadius, midAngle);

        // Convert midAngle to degrees for text rotation
        // Rotate text so it's readable (flip if on the left side)
        let textRotation = (midAngle * 180) / Math.PI;
        const needsFlip =
          midAngle > Math.PI / 2 - 0.01 &&
          midAngle < (3 * Math.PI) / 2 + 0.01;
        if (needsFlip) {
          textRotation += 180;
        }

        // Score label position (closer to center)
        const scoreRadius = OUTER_RADIUS * 0.32;
        const scorePos = polarToCartesian(CX, CY, scoreRadius, midAngle);

        return (
          <g
            key={area.id}
            onClick={() => onSelectArea(area.id)}
            className={cn("cursor-pointer transition-opacity", {
              "opacity-60": selectedArea !== null && !isSelected,
            })}
          >
            {/* Selection highlight */}
            {isSelected && (
              <path
                d={highlightPath}
                fill={area.color}
                opacity={0.25}
                filter="url(#glow)"
                stroke={area.color}
                strokeWidth={2}
              />
            )}

            {/* Background wedge (unfilled portion) */}
            <path
              d={bgPath}
              fill={area.color}
              opacity={0.12}
              stroke="#fff"
              strokeWidth={1.5}
            />

            {/* Filled wedge (score portion) */}
            {clampedScore > 0 && (
              <path
                d={filledPath}
                fill={area.color}
                opacity={isSelected ? 0.9 : 0.7}
                stroke="#fff"
                strokeWidth={0.5}
              />
            )}

            {/* Divider line for the slice */}
            <line
              x1={CX}
              y1={CY}
              x2={polarToCartesian(CX, CY, OUTER_RADIUS, sliceStart).x}
              y2={polarToCartesian(CX, CY, OUTER_RADIUS, sliceStart).y}
              stroke="#fff"
              strokeWidth={1.5}
              opacity={0.5}
            />

            {/* Hebrew label */}
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
              className={cn(
                "pointer-events-none fill-current font-medium",
                isSelected ? "text-purple-900" : "text-purple-800"
              )}
              style={{
                fontSize: isSelected ? "11px" : "10px",
                fontFamily: "inherit",
                direction: "rtl",
              }}
            >
              {area.label}
            </text>

            {/* Score number */}
            {clampedScore > 0 && (
              <text
                x={scorePos.x}
                y={scorePos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "pointer-events-none fill-current font-bold text-purple-900"
                )}
                style={{ fontSize: "14px" }}
              >
                {clampedScore}
              </text>
            )}
          </g>
        );
      })}

      {/* Center circle */}
      <circle cx={CX} cy={CY} r={MIN_RADIUS} fill="#f5f3ff" stroke="#c4b5fd" strokeWidth={1} />

      {/* Concentric guide rings for scale reference */}
      {[2, 4, 6, 8].map((tick) => {
        const r = (tick / 10) * FILL_RANGE + MIN_RADIUS;
        return (
          <circle
            key={tick}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="#c4b5fd"
            strokeWidth={0.3}
            opacity={0.4}
            className="pointer-events-none"
          />
        );
      })}
    </svg>
  );
}
