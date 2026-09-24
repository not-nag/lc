import React from "react";
import { palette } from "@/theme";
import { interFamily } from "./fonts";

/** Sliding-window bracket underneath a run of cells. */
export const Bracket: React.FC<{ x: number; width: number; label?: string; color?: string; opacity?: number }> = ({
  x, width, label, color = palette.olive, opacity = 1,
}) => (
  <div style={{ position: "absolute", left: x, width, bottom: -96, opacity }}>
    <div style={{ height: 20, borderLeft: `6px solid ${color}`, borderRight: `6px solid ${color}`,
      borderBottom: `6px solid ${color}`, borderRadius: "0 0 12px 12px" }} />
    {label && (
      <div style={{ textAlign: "center", marginTop: 8, fontFamily: interFamily, fontWeight: 700,
        fontSize: 34, letterSpacing: 1, color, whiteSpace: "nowrap" }}>{label}</div>
    )}
  </div>
);

/** Arc connecting two cells — the "these two are the answer" gesture. */
export const LinkArc: React.FC<{ x1: number; x2: number; label?: string; color?: string; progress?: number }> = ({
  x1, x2, label, color = palette.sage, progress = 1,
}) => {
  const left = Math.min(x1, x2), w = Math.max(60, Math.abs(x2 - x1));
  const h = Math.max(70, Math.min(150, 46 + w * 0.3));
  const d = `M 0 ${h} C ${w * 0.18} ${-h * 0.15}, ${w * 0.82} ${-h * 0.15}, ${w} ${h}`;
  return (
    <div style={{ position: "absolute", left, top: -h - 62, width: w, height: h, pointerEvents: "none" }}>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <path d={d} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
      </svg>
      {label && (
        <div style={{
          position: "absolute", top: h * 0.34, left: w / 2,
          transform: `translateX(-50%) scale(${0.7 + progress * 0.3})`,
          fontFamily: interFamily, fontWeight: 800, fontSize: 32, color: "#F4FBEF",
          background: color, borderRadius: 999, padding: "6px 22px", whiteSpace: "nowrap",
          opacity: Math.max(0, (progress - 0.45) / 0.55),
        }}>{label}</div>
      )}
    </div>
  );
};
