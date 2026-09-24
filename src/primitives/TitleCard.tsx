import React from "react";
import { palette } from "@/theme";
import { displayFamily, interFamily, monoFamily } from "./fonts";

const diffColor = { Easy: palette.sage, Medium: palette.mustard, Hard: palette.clay } as const;

export const TitleCard: React.FC<{
  number?: number; title: string; difficulty: "Easy" | "Medium" | "Hard"; progress: number; kicker?: string;
}> = ({ number, title, difficulty, progress, kicker }) => {
  const p = Math.min(1, progress);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 26, padding: 80 }}>
      {kicker && (
        <div style={{ fontFamily: interFamily, fontSize: 32, letterSpacing: 8, textTransform: "uppercase",
          color: palette.muted, fontWeight: 700, opacity: p }}>{kicker}</div>
      )}
      {number !== undefined && (
        <div style={{ fontFamily: monoFamily, fontSize: 40, fontWeight: 700, color: palette.terracotta,
          opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>#{number}</div>
      )}
      <div style={{
        fontFamily: displayFamily, fontSize: 104, fontWeight: 800, textAlign: "center",
        lineHeight: 1.03, color: palette.ink, letterSpacing: -3,
        opacity: p, transform: `translateY(${(1 - p) * 34}px) scale(${0.94 + p * 0.06})`,
      }}>{title}</div>
      <div style={{
        fontFamily: interFamily, fontSize: 30, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase",
        color: "#FFF8F0", background: diffColor[difficulty], borderRadius: 999, padding: "10px 30px", opacity: p,
      }}>{difficulty}</div>
    </div>
  );
};

export const BigText: React.FC<{ title?: string; body: string[]; variant: string; progress: number }> = ({
  title, body, variant, progress,
}) => {
  const p = Math.min(1, progress);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "0 12px", width: "100%" }}>
      {title && (
        <div style={{ fontFamily: displayFamily, fontSize: 78, fontWeight: 800, color: palette.ink,
          letterSpacing: -2, opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>{title}</div>
      )}
      {body.map((b, i) => (
        <div key={i} style={{
          fontFamily: variant === "big" ? displayFamily : interFamily,
          fontSize: variant === "big" ? 68 : 50, fontWeight: variant === "big" ? 700 : 600,
          color: palette.inkSoft, lineHeight: 1.35, display: "flex", gap: 18,
          opacity: Math.max(0, Math.min(1, p * 1.6 - i * 0.28)),
          transform: `translateY(${(1 - Math.min(1, p * 1.6 - i * 0.28)) * 16}px)`,
        }}>
          {variant === "bullets" && <span style={{ color: palette.terracotta, fontWeight: 800 }}>→</span>}
          <span>{b}</span>
        </div>
      ))}
    </div>
  );
};
