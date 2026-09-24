import React from "react";
import { palette, radius } from "@/theme";
import { interFamily, monoFamily } from "./fonts";

const variants: Record<string, { bg: string; fg: string; icon: string }> = {
  insight: { bg: palette.mustard, fg: "#3E2A05", icon: "✦" },
  warn:    { bg: palette.clay,    fg: "#FFEDE7", icon: "!" },
  math:    { bg: palette.indigo,  fg: "#EEF2F9", icon: "=" },
  note:    { bg: palette.surface, fg: palette.ink, icon: "•" },
};

export const Callout: React.FC<{ text: string; variant?: string; progress: number; top?: number }> = ({
  text, variant = "note", progress, top = 250,
}) => {
  const v = variants[variant] ?? variants.note;
  const p = Math.min(1, progress);
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center",
      opacity: p, transform: `scale(${0.9 + p * 0.1})`,
    }}>
      <div style={{
        background: v.bg, color: v.fg, borderRadius: radius.panel, padding: "18px 30px",
        fontFamily: interFamily, fontWeight: 700, fontSize: 37, display: "flex", gap: 16,
        alignItems: "center", maxWidth: 940, textAlign: "center", boxShadow: `0 8px 0 -2px #00000022`,
      }}>
        <span style={{ opacity: 0.6 }}>{v.icon}</span>{text}
      </div>
    </div>
  );
};

/** Big centred equation — the "here's the trick" beat. */
export const Formula: React.FC<{ text: string; progress: number; top?: number }> = ({ text, progress, top = 330 }) => {
  const p = Math.min(1, progress);
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center",
      opacity: p, transform: `translateY(${(1 - p) * 20}px)`,
    }}>
      <div style={{
        fontFamily: monoFamily, fontWeight: 700, fontSize: 62, color: palette.terracotta,
        background: palette.surfaceAlt, border: `4px dashed ${palette.terracotta}`,
        borderRadius: radius.panel, padding: "16px 40px", letterSpacing: -1,
      }}>{text}</div>
    </div>
  );
};

export const ResultBanner: React.FC<{ value: string; label?: string; progress: number }> = ({ value, label, progress }) => {
  const p = Math.min(1, progress);
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14, opacity: p,
    }}>
      <div style={{ fontFamily: interFamily, fontSize: 34, letterSpacing: 4, textTransform: "uppercase",
        color: palette.muted, fontWeight: 700 }}>{label ?? "Answer"}</div>
      <div style={{
        fontFamily: monoFamily, fontSize: 96, fontWeight: 800, color: "#F4FBEF",
        background: palette.sage, borderRadius: 24, padding: "18px 48px",
        transform: `scale(${0.8 + p * 0.2})`, boxShadow: `0 12px 0 -3px #43682F`,
      }}>{value}</div>
    </div>
  );
};

/**
 * A wry margin note. Deliberately styled as an aside — pencil-ish, off-axis,
 * lower contrast — so a joke never reads as an instruction.
 */
export const Aside: React.FC<{ text: string; progress: number; bottom?: number }> = ({
  text, progress, bottom = 330,
}) => {
  const p = Math.min(1, progress);
  return (
    <div style={{
      position: "absolute", right: 56, bottom, maxWidth: 800,
      opacity: p * 0.92, transform: `rotate(-1.6deg) translateY(${(1 - p) * 10}px)`,
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <span style={{ fontFamily: interFamily, fontSize: 34, fontWeight: 800, color: palette.mustard, lineHeight: 1 }}>※</span>
      <span style={{
        fontFamily: interFamily, fontStyle: "italic", fontWeight: 600, fontSize: 31,
        color: palette.muted, lineHeight: 1.3, textAlign: "right",
        borderBottom: `3px dashed ${palette.line}`, paddingBottom: 6,
      }}>{text}</span>
    </div>
  );
};
