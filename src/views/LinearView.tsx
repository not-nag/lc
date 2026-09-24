import React from "react";
import { Panel, Cell } from "@/primitives";
import { palette } from "@/theme";
import { interFamily } from "@/primitives/fonts";
import { enter } from "@/engine/tween";
import type { LinearState } from "@/engine/state";
import type { ViewProps } from "./types";

/** Stack grows upward; queue flows left→right. */
export const LinearView: React.FC<ViewProps<LinearState>> = ({ prev, next, t, stepIndex, into, fps, width, height, label }) => {
  const isStack = next.kind === "stack";
  const n = Math.max(next.items.length, 1);
  const size = isStack
    ? Math.max(48, Math.min(140, Math.floor((height - 150) / Math.max(n, 4)) - 12))
    : Math.max(48, Math.min(150, Math.min(
        Math.floor((width - 60) / Math.max(n, 3)) - 12,
        Math.floor(height - 150))));
  const prevStyle = new Map(prev.items.map((i) => [i.id, i.style]));
  const items = isStack ? [...next.items].reverse() : next.items;

  return (
    <Panel label={label}>
      <div style={{ display: "flex", flexDirection: isStack ? "column" : "row", gap: 10, alignItems: "center" }}>
        {items.length === 0 && (
          <div style={{ fontFamily: interFamily, fontSize: 30, color: palette.muted, opacity: 0.55,
            border: `3px dashed ${palette.line}`, borderRadius: 14, padding: "18px 34px" }}>empty</div>
        )}
        {items.map((it, k) => (
          <Cell key={it.id} value={String(it.value)} size={size} t={t}
            from={(prevStyle.get(it.id) ?? "idle") as any} to={it.style}
            enter={enter(stepIndex, it.born, into, fps)}
            dy={isStack && k === 0 && it.born === stepIndex ? (1 - t) * -30 : 0} />
        ))}
        <div style={{ fontFamily: interFamily, fontSize: 24, fontWeight: 700, color: palette.muted,
          letterSpacing: 2, textTransform: "uppercase", marginTop: isStack ? 6 : 0, marginLeft: isStack ? 0 : 10 }}>
          {isStack ? "↑ top" : "front →"}
        </div>
      </div>
    </Panel>
  );
};
