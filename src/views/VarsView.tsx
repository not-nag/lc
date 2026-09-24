import React from "react";
import { Panel } from "@/primitives";
import { monoFamily, interFamily } from "@/primitives/fonts";
import { palette, styleColors, radius } from "@/theme";
import { mixHex, enter } from "@/engine/tween";
import type { VarsState } from "@/engine/state";
import type { ViewProps } from "./types";

/** Live variable tracker — the thing that makes a trace followable. */
export const VarsView: React.FC<ViewProps<VarsState>> = ({ prev, next, t, stepIndex, into, fps, width, label }) => {
  const prevItems = new Map(prev.items.map((i) => [i.name, i]));
  return (
    <Panel label={label}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: width }}>
        {next.items.map((it) => {
          const p = prevItems.get(it.name);
          const a = styleColors[p?.style ?? "idle"] ?? styleColors.idle;
          const b = styleColors[it.style] ?? styleColors.idle;
          const changed = p && String(p.value) !== String(it.value);
          return (
            <div key={it.name} style={{
              display: "flex", alignItems: "center", gap: 12, borderRadius: radius.pill,
              background: mixHex(a.bg, b.bg, t), border: `3px solid ${mixHex(a.border, b.border, t)}`,
              padding: "12px 26px", whiteSpace: "nowrap", transform: `scale(${(changed ? 1 + Math.sin(Math.PI * t) * 0.09 : 1) * enter(stepIndex, it.born, into, fps)})`,
            }}>
              <span style={{ fontFamily: interFamily, fontSize: 32, fontWeight: 700,
                color: mixHex(a.fg, b.fg, t), opacity: 0.72 }}>{it.name}</span>
              <span style={{ fontFamily: monoFamily, fontSize: 42, fontWeight: 800,
                color: mixHex(a.fg, b.fg, t), fontVariantNumeric: "tabular-nums" }}>{String(it.value)}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
