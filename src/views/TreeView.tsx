import React from "react";
import { Panel } from "@/primitives";
import { monoFamily } from "@/primitives/fonts";
import { palette, styleColors } from "@/theme";
import { mixHex } from "@/engine/tween";
import { layoutTree } from "./layout";
import type { TreeState } from "@/engine/state";
import type { ViewProps } from "./types";

export const TreeView: React.FC<ViewProps<TreeState>> = ({ prev, next, t, width, height, label }) => {
  const w = Math.min(width, 980), h = Math.max(280, height - 96);
  const pos = layoutTree(next, w, h);
  const prevStyle = new Map(prev.nodes.map((n) => [n.id, n.style]));
  const R = Math.max(26, Math.min(48, 380 / Math.max(3, next.nodes.length) + 24));

  const edges: { a: string; b: string }[] = [];
  for (const n of next.nodes) { if (n.left) edges.push({ a: n.id, b: n.left }); if (n.right) edges.push({ a: n.id, b: n.right }); }

  return (
    <Panel label={label}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}
        preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible", maxWidth: w }}>
        {edges.map(({ a, b }, i) => {
          const p = pos.get(a), q = pos.get(b);
          if (!p || !q) return null;
          const childStyle = next.nodes.find((n) => n.id === b)?.style;
          const lit = childStyle && childStyle !== "idle";
          return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
            stroke={lit ? palette.terracotta : palette.line} strokeWidth={lit ? 6 : 4} strokeLinecap="round" />;
        })}
        {next.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const a = styleColors[prevStyle.get(n.id) ?? "idle"] ?? styleColors.idle;
          const b = styleColors[n.style] ?? styleColors.idle;
          const grow = n.style !== "idle" ? 1 + Math.sin(Math.PI * t) * 0.1 : 1;
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y}) scale(${grow})`}>
              <circle r={R} fill={mixHex(a.bg, b.bg, t)} stroke={mixHex(a.border, b.border, t)} strokeWidth={5} />
              <text textAnchor="middle" dominantBaseline="central" fill={mixHex(a.fg, b.fg, t)}
                style={{ fontFamily: monoFamily, fontWeight: 700, fontSize: R * 0.82 }}>{String(n.value)}</text>
            </g>
          );
        })}
      </svg>
    </Panel>
  );
};
