import React from "react";
import { Panel } from "@/primitives";
import { monoFamily, interFamily } from "@/primitives/fonts";
import { palette, styleColors, radius } from "@/theme";
import { mixHex } from "@/engine/tween";
import type { GridState } from "@/engine/state";
import type { ViewProps } from "./types";

/** Matrix / DP table / island map. */
export const GridView: React.FC<ViewProps<GridState>> = ({ prev, next, t, width, height, label }) => {
  const rows = next.cells.length, cols = next.cells[0]?.length ?? 1;
  const size = Math.max(34, Math.min(110, Math.floor(Math.min((width - 40) / cols, (height - 150) / rows)) - 8));
  const gap = size > 70 ? 10 : 6;

  return (
    <Panel label={label}>
      <div style={{ position: "relative", display: "grid", gap,
        gridTemplateColumns: `repeat(${cols}, ${size}px)` }}>
        {next.cells.map((row, r) => row.map((c, ci) => {
          const p = prev.cells[r]?.[ci];
          const a = styleColors[p?.style ?? "idle"] ?? styleColors.idle;
          const b = styleColors[c.style] ?? styleColors.idle;
          const changed = p && String(p.value) !== String(c.value);
          return (
            <div key={c.id} style={{
              width: size, height: size, borderRadius: size > 70 ? radius.cell : 8,
              background: mixHex(a.bg, b.bg, t), border: `${size > 60 ? 4 : 3}px solid ${mixHex(a.border, b.border, t)}`,
              color: mixHex(a.fg, b.fg, t), display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: monoFamily, fontWeight: 700, fontSize: size * 0.4, fontVariantNumeric: "tabular-nums",
              transform: changed ? `scale(${1 + Math.sin(Math.PI * t) * 0.12})` : "none",
            }}>{String(c.value)}</div>
          );
        }))}

        {Object.entries(next.cursors).map(([name, cur]) => {
          const was = prev.cursors[name] ?? cur;
          const r = was.r + (cur.r - was.r) * t, c = was.c + (cur.c - was.c) * t;
          return (
            <div key={name} style={{
              position: "absolute", left: c * (size + gap) - 6, top: r * (size + gap) - 6,
              width: size + 12, height: size + 12, borderRadius: radius.cell,
              border: `5px solid ${palette.terracotta}`, pointerEvents: "none",
              boxShadow: `0 0 0 4px ${palette.terracotta}22`,
            }}>
              <span style={{ position: "absolute", top: -38, left: "50%", transform: "translateX(-50%)",
                fontFamily: interFamily, fontWeight: 800, fontSize: 24, color: palette.terracotta }}>{name}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
