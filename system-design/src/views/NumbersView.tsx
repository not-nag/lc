import React from "react";
import { Panel } from "@/primitives";
import { monoFamily, displayFamily } from "@/primitives/fonts";
import { palette, styleColors, radius } from "@/theme";
import { mixHex, enter, fadeIn } from "@/engine/anim";
import type { NumbersState } from "@/engine/state";
import type { ViewProps } from "./types";

/**
 * The capacity readout — the system-design vars panel. A figure, what it's of, and how it
 * was derived. A strip of cards when the pane is wide; a column of rows when it's tall.
 */
export const NumbersView: React.FC<ViewProps<NumbersState>> = ({ prev, next, t, slideIndex, width, height, label }) => {
  const prevItems = new Map(prev.items.map((i) => [i.key, i]));
  const nextKeys = new Set(next.items.map((i) => i.key));
  const leaving = prev.items.filter((i) => !nextKeys.has(i.key));
  const items = [...next.items, ...leaving];
  const tall = height > width * 0.6;
  const n = Math.max(1, items.length);
  // Panel pads its content by 8 on each side — a card taller than what's left gets clipped
  const usableH = height - 16 - (label ? 60 : 0);

  // size to fit: a column divides the height, a strip divides the width
  const rowH = tall ? Math.min(150, (usableH - (n - 1) * 12) / n) : Math.min(124, usableH - 6);
  const cardW = tall ? width - 16 : Math.min(420, (width - 16 - (n - 1) * 14) / n);
  const valueFs = tall ? Math.min(54, rowH * 0.46) : Math.min(46, rowH * 0.34, cardW * 0.13);

  return (
    <Panel label={label}>
      <div style={{
        display: "flex", flexDirection: tall ? "column" : "row", gap: tall ? 12 : 14,
        justifyContent: "center", alignItems: "stretch", width: "100%",
      }}>
        {items.map((it) => {
          const p = prevItems.get(it.key);
          const gone = !nextKeys.has(it.key);
          const a = styleColors[p?.style ?? "idle"] ?? styleColors.idle;
          const b = styleColors[gone ? "idle" : it.style] ?? styleColors.idle;
          const changed = p && p.value !== it.value;
          const s = gone ? 1 - fadeIn(t) : enter(slideIndex, it.born, t);
          const bump = changed ? 1 + Math.sin(Math.PI * t) * 0.08 : 1;
          const fg = mixHex(a.fg, b.fg, t);
          return (
            <div key={it.key} style={{
              width: cardW, height: rowH, flexShrink: 0,
              display: "flex", flexDirection: tall ? "row" : "column",
              justifyContent: tall ? "space-between" : "center", alignItems: tall ? "center" : "flex-start",
              gap: tall ? 18 : 0, padding: tall ? "0 26px" : "6px 22px",
              background: mixHex(a.bg, b.bg, t), border: `3px solid ${mixHex(a.border, b.border, t)}`,
              borderRadius: radius.panel, opacity: Math.min(1, s * 1.2), transform: `scale(${s})`,
              boxShadow: `0 6px 0 -3px ${palette.bgDeep}`,
            }}>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flexShrink: 0 }}>
                <span style={{ fontFamily: displayFamily, fontSize: Math.max(20, valueFs * (tall ? 0.5 : 0.52)), fontWeight: 600,
                  color: fg, opacity: 0.75, whiteSpace: "nowrap", lineHeight: 1.15 }}>{it.key}</span>
                {tall && it.note && <Note text={it.note} fs={Math.max(17, valueFs * 0.38)} color={fg} />}
              </div>
              <span style={{
                fontFamily: monoFamily, fontSize: valueFs, fontWeight: 800, color: fg, lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0,
                transform: `scale(${bump})`, transformOrigin: tall ? "right center" : "left center",
              }}>{it.value}</span>
              {!tall && it.note && <Note text={it.note} fs={Math.max(17, valueFs * 0.4)} color={fg} />}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const Note: React.FC<{ text: string; fs: number; color: string }> = ({ text, fs, color }) => (
  <span style={{ fontFamily: monoFamily, fontSize: fs, fontWeight: 600, color, opacity: 0.6, lineHeight: 1.25, flexShrink: 0,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</span>
);
