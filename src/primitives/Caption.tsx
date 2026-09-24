import React from "react";
import { palette, radius } from "@/theme";
import { interFamily, monoFamily } from "./fonts";

/** Split "need = 9 − 2 = 7" so the expression renders in mono and the prose doesn't. */
const isExpr = (s: string) => /[=<>+\-*/[\]]|\bO\(/.test(s) && s.length < 34;

/**
 * A step label: what the algorithm is DOING right now. Deliberately not a subtitle —
 * it must stay true no matter what a later voiceover says over it.
 */
export const StepLabel: React.FC<{ text?: string; progress: number; bottom?: number; index?: number }> = ({
  text, progress, bottom = 140,
}) => {
  if (!text) return null;
  const p = Math.min(1, progress);
  const mono = isExpr(text);
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center",
      padding: "0 60px", opacity: p, transform: `translateY(${(1 - p) * 10}px)`,
    }}>
      <div style={{
        background: palette.surfaceAlt, border: `4px solid ${palette.line}`,
        color: palette.ink, borderRadius: radius.panel, padding: "18px 34px",
        display: "flex", alignItems: "center", gap: 16, maxWidth: 940,
        boxShadow: `0 7px 0 -2px ${palette.bgDeep}`,
      }}>
        <span style={{ color: palette.terracotta, fontFamily: interFamily, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>›</span>
        <span style={{
          fontFamily: mono ? monoFamily : interFamily,
          fontWeight: mono ? 700 : 600, fontSize: mono ? 46 : 44,
          lineHeight: 1.22, textAlign: "left", fontVariantNumeric: "tabular-nums",
        }}>{text}</span>
      </div>
    </div>
  );
};

/** @deprecated kept so older imports keep compiling */
export const Caption = StepLabel;
