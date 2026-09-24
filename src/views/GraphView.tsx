import React from "react";
import { Panel } from "@/primitives";
import { monoFamily } from "@/primitives/fonts";
import { palette, styleColors } from "@/theme";
import { mixHex } from "@/engine/anim";
import { layoutGraph } from "./layout";
import type { GraphState } from "@/engine/state";
import type { ViewProps } from "./types";

export const GraphView: React.FC<ViewProps<GraphState>> = ({ prev, next, t, width, height, label }) => {
  const w = Math.min(width, 980), h = Math.max(300, height - 96);
  const pos = layoutGraph(next, w, h);
  const prevNode = new Map(prev.nodes.map((n) => [n.id, n.style]));
  const prevEdge = new Map(prev.edges.map((e) => [`${e.from}>${e.to}`, e.style]));
  const R = Math.max(28, Math.min(52, 420 / Math.max(3, next.nodes.length) + 26));

  return (
    <Panel label={label}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}
        preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible", maxWidth: w }}>
        <defs>
          <marker id="ah" markerUnits="userSpaceOnUse" markerWidth="18" markerHeight="18"
            refX="15" refY="9" orient="auto">
            <path d="M0,1 L17,9 L0,17 z" fill={palette.muted} />
          </marker>
        </defs>
        {next.edges.map((e, i) => {
          const p = pos.get(e.from), q = pos.get(e.to);
          if (!p || !q) return null;
          const was = prevEdge.get(`${e.from}>${e.to}`) ?? "idle";
          const col = mixHex(styleColors[was].border, styleColors[e.style].border, t);
          const lit = e.style !== "idle";
          return (
            <g key={i}>
              <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={lit ? col : palette.line}
                strokeWidth={lit ? 7 : 4} strokeLinecap="round" markerEnd={e.directed ? "url(#ah)" : undefined} />
              {e.weight !== undefined && (
                <text x={(p.x + q.x) / 2} y={(p.y + q.y) / 2 - 10} textAnchor="middle" fill={palette.muted}
                  style={{ fontFamily: monoFamily, fontSize: 24, fontWeight: 700 }}>{e.weight}</text>
              )}
            </g>
          );
        })}
        {next.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const a = styleColors[prevNode.get(n.id) ?? "idle"] ?? styleColors.idle;
          const b = styleColors[n.style] ?? styleColors.idle;
          const grow = n.style !== "idle" ? 1 + Math.sin(Math.PI * t) * 0.1 : 1;
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y}) scale(${grow})`}>
              <circle r={R} fill={mixHex(a.bg, b.bg, t)} stroke={mixHex(a.border, b.border, t)} strokeWidth={5} />
              <text textAnchor="middle" dominantBaseline="central" fill={mixHex(a.fg, b.fg, t)}
                style={{ fontFamily: monoFamily, fontWeight: 700, fontSize: R * 0.7 }}>{n.label ?? n.id}</text>
            </g>
          );
        })}
      </svg>
    </Panel>
  );
};
