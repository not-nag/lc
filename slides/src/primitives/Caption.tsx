"use client";
import React, { useEffect, useRef } from "react";
import { palette, radius } from "@/theme";
import { interFamily, monoFamily } from "./fonts";

/** Expressions render in mono; prose doesn't. */
const isExpr = (s: string) => /[=<>+\-*/[\]]|\bO\(/.test(s) && s.length < 40;

/**
 * The line under the slide: what this step does. Click it to edit when the deck is
 * in authoring mode — the text is yours, not the generator's.
 */
export const StepLabel: React.FC<{
  text?: string; progress: number; bottom?: number;
  onEdit?: (value: string) => void;
}> = ({ text, progress, bottom = 140, onEdit }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerText !== (text ?? "")) ref.current.innerText = text ?? ""; }, [text]);

  if (!text && !onEdit) return null;
  const p = Math.min(1, progress);
  const mono = isExpr(text ?? "");

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom, zIndex: 50, display: "flex", justifyContent: "center",
      padding: "0 60px", opacity: p, transform: `translateY(${(1 - p) * 10}px)`,
    }}>
      <div style={{
        background: palette.surfaceAlt, border: `4px solid ${palette.line}`, color: palette.ink,
        borderRadius: radius.panel, padding: "18px 34px", display: "flex", alignItems: "center",
        gap: 16, maxWidth: 940, boxShadow: `0 7px 0 -2px ${palette.bgDeep}`,
        minHeight: text ? undefined : 76,
      }}>
        <span style={{ color: palette.terracotta, fontFamily: interFamily, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>›</span>
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
            fontWeight: mono ? 700 : 600, fontSize: mono ? 46 : 44,
            lineHeight: 1.22, textAlign: "left", fontVariantNumeric: "tabular-nums",
            outline: "none", minWidth: onEdit ? 40 : undefined, cursor: onEdit ? "text" : "default",
          }}
        />
      </div>
    </div>
  );
};

/** @deprecated older name */
export const Caption = StepLabel;
