"use client";
import React, { useEffect, useRef, useState } from "react";
import { palette } from "@/theme";
import { interFamily, monoFamily } from "./fonts";

/** Expressions render in mono; prose doesn't. */
const isExpr = (s: string) => /[=<>+\-*/[\]]|\bO\(/.test(s) && s.length < 44;

/**
 * The line under the slide: what this step does. Just the text — no band, no rules,
 * no chrome. A slide with nothing to say renders nothing, so blank slides are a real
 * pause rather than an empty container.
 */
export const StepLabel: React.FC<{
  text?: string;
  progress: number;
  bottom?: number;
  onEdit?: (value: string) => void;
}> = ({ text, progress, bottom = 92, onEdit }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== (text ?? "")) ref.current.innerText = text ?? "";
  }, [text]);

  const empty = !text?.trim();
  // nothing to say and nothing to edit: draw nothing at all
  if (empty && !onEdit) return null;

  const p = Math.min(1, progress);
  const mono = isExpr(text ?? "");

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute", left: 0, right: 0, bottom, zIndex: 50,
        display: "flex", justifyContent: "center", padding: "0 90px",
        minHeight: 64, alignItems: "center", pointerEvents: onEdit ? "auto" : "none",
      }}
    >
      <span
        ref={ref}
        contentEditable={!!onEdit}
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => onEdit?.(e.currentTarget.innerText.replace(/\n/g, " ").trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
          if (e.key === "Escape") { e.currentTarget.innerText = text ?? ""; (e.currentTarget as HTMLElement).blur(); }
          e.stopPropagation();   // never let typing drive the deck
        }}
        style={{
          fontFamily: mono ? monoFamily : interFamily,
          fontWeight: mono ? 700 : 600,
          fontSize: mono ? 52 : 48,
          letterSpacing: mono ? -0.5 : -0.3,
          lineHeight: 1.2, textAlign: "center",
          color: palette.ink, fontVariantNumeric: "tabular-nums",
          outline: "none", cursor: onEdit ? "text" : "default",
          minWidth: empty ? 320 : undefined,
          opacity: empty ? 0 : 0.2 + 0.8 * p,
          transform: `translateY(${(1 - p) * 8}px)`,
        }}
      />
      {/* only while authoring, and only on hover — never visible in a recording */}
      {empty && onEdit && (
        <span style={{
          position: "absolute", fontFamily: interFamily, fontSize: 30, fontWeight: 500,
          color: palette.muted, opacity: hover ? 0.5 : 0, transition: "opacity .15s",
          pointerEvents: "none",
        }}>click to add a line</span>
      )}
    </div>
  );
};

/** @deprecated older name */
export const Caption = StepLabel;
