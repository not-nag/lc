import React from "react";
import { interFamily } from "./fonts";

/** A labelled caret that slides between cells. */
export const Pointer: React.FC<{
  x: number; label: string; color: string; scale?: number; opacity?: number; below?: boolean; size?: number;
}> = ({ x, label, color, scale = 1, opacity = 1, below = false, size = 108 }) => (
  <div style={{
    position: "absolute", left: x, top: below ? undefined : -74, bottom: below ? -74 : undefined,
    transform: `translateX(-50%) scale(${scale})`, opacity,
    display: "flex", flexDirection: below ? "column-reverse" : "column", alignItems: "center", gap: 2,
  }}>
    <div style={{
      fontFamily: interFamily, fontWeight: 800, fontSize: size * 0.24, color,
      background: `${color}1E`, border: `3px solid ${color}`, borderRadius: 999,
      padding: `2px ${size * 0.13}px`, whiteSpace: "nowrap",
    }}>{label}</div>
    <div style={{
      width: 0, height: 0, borderLeft: "11px solid transparent", borderRight: "11px solid transparent",
      ...(below ? { borderBottom: `14px solid ${color}` } : { borderTop: `14px solid ${color}` }),
    }} />
  </div>
);
