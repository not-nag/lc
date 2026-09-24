import React from "react";
import { styleColors, radius, palette } from "@/theme";
import { monoFamily, interFamily } from "./fonts";
import { mixHex } from "@/engine/anim";
import type { Style } from "@/schema/ops";

export const CELL = 132;
export const GAP = 14;

/** One boxed value. Colour cross-fades between the previous and next style. */
export const Cell: React.FC<{
  value: React.ReactNode;
  from: Style; to: Style; t: number;
  index?: number; showIndex?: boolean;
  size?: number; enter?: number; dy?: number; dx?: number; zIndex?: number;
}> = ({ value, from, to, t, index, showIndex, size = CELL, enter = 1, dy = 0, dx = 0, zIndex = 1 }) => {
  const a = styleColors[from] ?? styleColors.idle;
  const b = styleColors[to] ?? styleColors.idle;
  const bg = mixHex(a.bg, b.bg, t);
  const fg = mixHex(a.fg, b.fg, t);
  const bd = mixHex(a.border, b.border, t);
  const lift = to !== "idle" && to !== "dim" ? t * 6 : 0;
  const fs = typeof value === "string" && value.length > 3 ? size * 0.3 : size * 0.4;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex,
      transform: `translate(${dx}px, ${dy - lift}px) scale(${enter})`, opacity: enter }}>
      <div style={{
        width: size, height: size, borderRadius: radius.cell, background: bg, color: fg,
        border: `4px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: monoFamily, fontSize: fs, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        boxShadow: `0 ${4 + lift}px 0 -1px ${mixHex(a.border, b.border, t)}33`,
      }}>{value}</div>
      {showIndex && (
        <div style={{ fontFamily: interFamily, fontSize: size * 0.2, color: palette.muted, fontWeight: 600 }}>
          {index}
        </div>
      )}
    </div>
  );
};
