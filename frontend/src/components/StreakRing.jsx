import React from "react";

// StreakRing: circular progress ring showing current streak toward a target (e.g., 30)
// Props: value (number), max (number, default 30), size (px), stroke (px)
export default function StreakRing({ value = 0, max = 30, size = 48, stroke = 6 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(value, max));
  const progress = circumference * (1 - clamped / max);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Solid monochrome; no gradient defs */}
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="var(--green-main)"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={progress}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 300ms ease-out" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={12} fill="var(--text)" fontWeight={700}>
        {value}
      </text>
    </svg>
  );
}
