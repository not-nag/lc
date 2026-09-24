"use client";
import React, { useEffect, useRef } from "react";
import { palette } from "@/theme";
import { interFamily, monoFamily } from "./fonts";

/** Expressions render in mono; prose doesn't. */
const isExpr = (s: string) => /[=<>+\-*/[\]]|\bO\(/.test(s) && s.length < 44;

/**
 * The lower third: what this step does, anchored to the bottom edge of the slide.
 * A band rather than a floating chip — it gives the text weight and stops it drifting
 * in the empty space under the stage. Click to edit when authoring.
 */
export const StepLabel: React.FC<{
  text?: string;
  progress: number;
  /** 0 → 1 through the deck, drawn as a hairline along the very bottom */
  deckProgress?: number;
  height?: number;
  onEdit?: (value: string) => void;
}> = ({ text, progress, deckProgress, height = 148, onEdit }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== (text ?? "")) ref.current.innerText = text ?? "";
  }, [text]);

  const p = Math.min(1, progress);
  const mono = isExpr(text ?? "");
  const empty = !text?.trim();

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 50, height,
      display: "flex", alignItems: "center", gap: 26, padding: "0 64px",
      background: `linear-gradient(to top, ${palette.bgDeep}, ${palette.surfaceAlt})`,
      borderTop: `3px solid ${palette.line}`,
      // the band holds still; only the text moves, so nothing jumps between slides
    }}>
      {/* accent bar — a quiet anchor where a chevron used to shout */}
      <span style={{
        width: 8, height: 62, borderRadius: 4, flexShrink: 0,
        background: empty ? palette.line : palette.terracotta,
        opacity: empty ? 0.5 : 0.35 + 0.65 * p,
        transform: `scaleY(${0.6 + 0.4 * p})`,
      }} />

      <span
        ref={ref}
        contentEditable={!!onEdit}
        suppressContentEditableWarning
        spellCheck={false}
        data-placeholder={onEdit ? "click to write this step…" : undefined}
        onBlur={(e) => onEdit?.(e.currentTarget.innerText.replace(/\n/g, " ").trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
          if (e.key === "Escape") { e.currentTarget.innerText = text ?? ""; (e.currentTarget as HTMLElement).blur(); }
          e.stopPropagation();   // never let typing drive the deck
        }}
        style={{
          flex: 1, minWidth: 0,
          fontFamily: mono ? monoFamily : interFamily,
          fontWeight: mono ? 700 : 600,
          fontSize: mono ? 50 : 46,
          letterSpacing: mono ? -0.5 : -0.2,
          lineHeight: 1.18, color: palette.ink,
          fontVariantNumeric: "tabular-nums",
          outline: "none", cursor: onEdit ? "text" : "default",
          opacity: 0.25 + 0.75 * p,
          transform: `translateY(${(1 - p) * 8}px)`,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
      />

      {deckProgress !== undefined && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: palette.line }}>
          <div style={{
            height: "100%", width: `${Math.max(0, Math.min(1, deckProgress)) * 100}%`,
            background: palette.terracotta, transition: "width .35s ease",
          }} />
        </div>
      )}
    </div>
  );
};

/** @deprecated older name */
export const Caption = StepLabel;
