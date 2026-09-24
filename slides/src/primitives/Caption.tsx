import React from "react";
import { palette } from "@/theme";
import { interFamily, monoFamily } from "./fonts";

/** Expressions render in mono; prose doesn't. */
const isExpr = (s: string) => /[=<>+\-*/[\]]|\bO\(/.test(s) && s.length < 44;

/**
 * The line under the slide: what this step does. Just the text — no band or chrome.
 * A slide with nothing to say renders nothing, so a blank slide is a real pause.
 */
export const StepLabel: React.FC<{ text?: string; progress: number; bottom?: number }> = ({
  text, progress, bottom = 92,
}) => {
  if (!text?.trim()) return null;
  const p = Math.min(1, progress);
  const mono = isExpr(text);

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom, zIndex: 50,
      display: "flex", justifyContent: "center", padding: "0 90px", pointerEvents: "none",
    }}>
      <span style={{
        fontFamily: mono ? monoFamily : interFamily,
        fontWeight: mono ? 700 : 600,
        fontSize: mono ? 52 : 48,
        letterSpacing: mono ? -0.5 : -0.3,
        lineHeight: 1.2, textAlign: "center",
        color: palette.ink, fontVariantNumeric: "tabular-nums",
        opacity: 0.2 + 0.8 * p,
        transform: `translateY(${(1 - p) * 8}px)`,
      }}>{text}</span>
    </div>
  );
};

/** @deprecated older name */
export const Caption = StepLabel;
