import React from "react";
import { Panel } from "@/primitives";
import { monoFamily, interFamily } from "@/primitives/fonts";
import { palette, styleColors, radius } from "@/theme";
import { mixHex, enter } from "@/engine/tween";
import type { ListState } from "@/engine/state";
import type { ViewProps } from "./types";

/**
 * Nodes hold their declared position; only the arrows move. That is what makes an
 * in-place reversal readable — a chain-walk layout would scatter the nodes instead.
 */
export const ListView: React.FC<ViewProps<ListState>> = ({ prev, next, t, stepIndex, into, fps, width, height, label }) => {
  const nodes = next.nodes;
  const n = Math.max(nodes.length, 1);
  const GAP = 56;
  const size = Math.max(52, Math.min(150,
    Math.min(Math.floor((width - 40 - GAP * (n - 1)) / n), Math.floor(height - 250))));
  const pitch = size + GAP;
  const rowW = n * pitch - GAP;
  const pos = new Map(nodes.map((x, i) => [x.id, i]));
  const prevStyle = new Map(prev.nodes.map((x) => [x.id, x.style]));

  return (
    <Panel label={label}>
      <div style={{ position: "relative", width: rowW, height: size, marginTop: 74, marginBottom: 74 }}>
        <svg width={rowW} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <marker id="la" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16"
              refX="13" refY="8" orient="auto">
              <path d="M0,1 L15,8 L0,15 z" fill={palette.inkSoft} />
            </marker>
            <marker id="lb" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16"
              refX="13" refY="8" orient="auto">
              <path d="M0,1 L15,8 L0,15 z" fill={palette.terracotta} />
            </marker>
          </defs>
          {nodes.map((node) => {
            const i = pos.get(node.id)!;
            const cx = i * pitch + size / 2;
            if (node.next === null) {
              return (
                <g key={node.id}>
                  <line x1={cx} y1={size + 6} x2={cx} y2={size + 26} stroke={palette.line} strokeWidth={4} />
                  <text x={cx} y={size + 58} textAnchor="middle" fill={palette.line}
                    style={{ fontFamily: monoFamily, fontSize: 32, fontWeight: 700 }}>∅</text>
                </g>
              );
            }
            const j = pos.get(node.next);
            if (j === undefined) return null;
            const tx = j * pitch + size / 2;
            const forward = j > i;
            const y = size / 2;
            // backward links arc over the top of both nodes, so a flip is unmistakable
            const d = forward
              ? `M ${cx + size / 2 + 8} ${y} L ${tx - size / 2 - 14} ${y}`
              : `M ${cx} ${-8} C ${cx} ${-size * 0.62}, ${tx} ${-size * 0.62}, ${tx} ${-14}`;
            return <path key={node.id} d={d} fill="none" stroke={forward ? palette.inkSoft : palette.terracotta}
              strokeWidth={forward ? 5 : 6} strokeLinecap="round" markerEnd={forward ? "url(#la)" : "url(#lb)"} />;
          })}
        </svg>

        {nodes.map((node) => {
          const i = pos.get(node.id)!;
          const a = styleColors[prevStyle.get(node.id) ?? "idle"] ?? styleColors.idle;
          const b = styleColors[node.style] ?? styleColors.idle;
          const e = enter(stepIndex, node.born, into, fps);
          const isHead = next.head === node.id;
          return (
            <div key={node.id} style={{
              position: "absolute", left: i * pitch, top: 0, width: size, height: size,
              borderRadius: radius.cell, background: mixHex(a.bg, b.bg, t),
              border: `4px solid ${mixHex(a.border, b.border, t)}`, color: mixHex(a.fg, b.fg, t),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: monoFamily, fontWeight: 700, fontSize: size * 0.42,
              transform: `scale(${e})`, opacity: e,
            }}>
              {String(node.value)}
              {isHead && (
                <span style={{ position: "absolute", top: -40, fontFamily: interFamily, fontSize: 24,
                  fontWeight: 800, color: palette.muted, letterSpacing: 1 }}>head</span>
              )}
            </div>
          );
        })}
        {nodes.length === 0 && <span style={{ fontFamily: interFamily, fontSize: 34, color: palette.muted }}>null</span>}
      </div>
    </Panel>
  );
};
