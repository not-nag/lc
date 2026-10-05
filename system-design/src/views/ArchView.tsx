import React, { useId } from "react";
import { Panel } from "@/primitives";
import { monoFamily, displayFamily } from "@/primitives/fonts";
import { palette, styleColors } from "@/theme";
import { mixHex, pop, fadeIn, Easing, clamp01, lerp } from "@/engine/anim";
import type { ArchState, ArchNode, ArchEdge } from "@/engine/state";
import type { ViewProps } from "./types";
import { layoutArch, lerpBox, edgeSegment, type Box } from "./archLayout";

/** A thin strip down the left of each box says what kind of thing it is. */
const kindAccent: Record<string, string> = {
  client: palette.indigo, edge: palette.olive, service: palette.terracotta,
  cache: palette.mustard, store: palette.sage, queue: "#8B6BA8", worker: palette.clay,
};

const edgeColor = (style: string) =>
  style === "bad" ? palette.clay
  : style === "active" || style === "compare" ? palette.terracotta
  : style === "match" ? palette.sage
  : style === "dim" ? palette.line
  : palette.muted;

/**
 * Boxes and arrows, laid out by tier. Everything is a function of (prev, next, t):
 * boxes glide between layouts, new ones pop in, removed ones fade, arrows draw themselves,
 * the bottleneck marker travels from the box it was on to the box it's on now, and request
 * tokens walk their path hop by hop, lighting each arrow as they cross it.
 */
export const ArchView: React.FC<ViewProps<ArchState>> = ({ prev, next, t, slideIndex, width, height, label }) => {
  const uid = useId().replace(/:/g, "");
  const W = Math.max(400, width), H = Math.max(260, height - (label ? 56 : 0));
  const L0 = layoutArch(prev, W, H), L1 = layoutArch(next, W, H);
  const e = Easing.inOut(clamp01(t));

  const boxOf = (id: string): Box | undefined => {
    const b = L1.boxes.get(id);
    return b ? lerpBox(L0.boxes.get(id), b, e) : L0.boxes.get(id);
  };
  const prevNode = new Map(prev.nodes.map((n) => [n.id, n]));
  const nextIds = new Set(next.nodes.map((n) => n.id));
  const prevEdge = new Map(prev.edges.map((x) => [`${x.from}>${x.to}`, x]));
  const nextEdgeKeys = new Set(next.edges.map((x) => `${x.from}>${x.to}`));

  /* tier captions, one per occupied column */
  const tierKeys = [...new Set([...L0.columns.keys(), ...L1.columns.keys()])];

  /* request tokens: position along the path as a real number of hops */
  const tokenList = [
    ...Object.entries(next.tokens).map(([name, tk]) => {
      const was = prev.tokens[name];
      const born = !was;
      const u = born ? tk.at : lerp(was.at, tk.at, e);
      return { name, tk, u, alpha: born ? pop(t) : 1, label: tk.label, prevLabel: was?.label };
    }),
    ...Object.entries(prev.tokens).filter(([n]) => !next.tokens[n])
      .map(([name, tk]) => ({ name, tk, u: tk.at, alpha: 1 - fadeIn(t), label: tk.label, prevLabel: tk.label })),
  ];

  return (
    <Panel label={label} flush>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: "visible" }}>
        <defs>
          {["muted", "terracotta", "clay", "sage", "line"].map((c) => (
            <marker key={c} id={`${uid}-ah-${c}`} markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20"
              refX="16" refY="10" orient="auto">
              <path d="M0,2 L18,10 L0,18 z" fill={(palette as any)[c]} />
            </marker>
          ))}
        </defs>

        {tierKeys.map((tier) => {
          const a = L0.columns.get(tier), b = L1.columns.get(tier);
          const x = b !== undefined ? (a !== undefined ? lerp(a, b, e) : b) : a!;
          const op = b !== undefined ? (a !== undefined ? 1 : fadeIn(t)) : 1 - fadeIn(t);
          return (
            <text key={tier} x={x} y={28} textAnchor="middle" fill={palette.muted} opacity={0.6 * op}
              style={{ fontFamily: displayFamily, fontSize: 24, fontWeight: 600 }}>
              {next.tiers[tier] ?? prev.tiers[tier] ?? `tier ${tier}`}
            </text>
          );
        })}

        {/* arrows, including ones fading out */}
        {[...next.edges, ...prev.edges.filter((x) => !nextEdgeKeys.has(`${x.from}>${x.to}`))].map((ed) => {
          const key = `${ed.from}>${ed.to}`;
          const gone = !nextEdgeKeys.has(key);
          const was = prevEdge.get(key);
          const a = boxOf(ed.from), b = boxOf(ed.to);
          if (!a || !b) return null;
          return <Arrow key={key} uid={uid} edge={ed} was={was} a={a} b={b} t={t}
            draw={gone ? 1 : was ? 1 : Easing.outCubic(clamp01(t))} alpha={gone ? 1 - fadeIn(t) : 1} />;
        })}

        {/* the path a request has travelled so far, drawn over the arrows */}
        {tokenList.map(({ name, tk, u, alpha }) => tk.path.slice(1).map((to, k) => {
          const from = tk.path[k];
          const lit = clamp01(u - k);
          if (lit <= 0) return null;
          const a = boxOf(from), b = boxOf(to);
          if (!a || !b) return null;
          const s = edgeSegment(a, b, 6);
          return <line key={`${name}-${k}`} x1={s.x1} y1={s.y1} x2={lerp(s.x1, s.x2, lit)} y2={lerp(s.y1, s.y2, lit)}
            stroke={palette.terracotta} strokeWidth={7} strokeLinecap="round" opacity={0.85 * alpha} />;
        }))}

        {/* boxes, including ones fading out */}
        {[...next.nodes, ...prev.nodes.filter((n) => !nextIds.has(n.id))].map((n) => {
          const b = boxOf(n.id);
          if (!b) return null;
          const gone = !nextIds.has(n.id);
          const was = prevNode.get(n.id);
          const enter = gone ? 1 - fadeIn(t) : was ? 1 : pop(t);
          return <NodeBox key={n.id} node={n} was={was} box={b} t={t} enter={enter} />;
        })}

        <BottleneckMarker prev={prev} next={next} boxOf={boxOf} t={t} slideIndex={slideIndex} />

        {tokenList.map(({ name, tk, u, alpha, label, prevLabel }) => {
          const k = Math.min(Math.floor(u), tk.path.length - 2), f = u - k;
          const a = boxOf(tk.path[k]), b = boxOf(tk.path[k + 1]);
          if (!a || !b) return null;
          const x = lerp(a.x, b.x, f), y = lerp(a.y + a.h / 2, b.y + b.h / 2, f) + 26;
          const txt = label ?? "";
          const changed = prevLabel !== undefined && prevLabel !== label;
          return (
            <g key={name} transform={`translate(${x},${y}) scale(${Math.max(0.01, alpha)})`} opacity={Math.min(1, alpha * 1.2)}>
              <circle r={15} fill={palette.terracotta} stroke="#FFF6EC" strokeWidth={4} />
              {txt && (
                <g transform={`translate(0, 44) scale(${changed ? 1 + Math.sin(Math.PI * t) * 0.12 : 1})`}>
                  <rect x={-(txt.length * 8.2 + 22)} y={-22} width={txt.length * 16.4 + 44} height={44} rx={22}
                    fill={palette.terracotta} />
                  <text textAnchor="middle" dominantBaseline="central" fill="#FFF6EC"
                    style={{ fontFamily: monoFamily, fontSize: 25, fontWeight: 700 }}>{txt}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </Panel>
  );
};

const Arrow: React.FC<{
  uid: string; edge: ArchEdge; was?: ArchEdge; a: Box; b: Box; t: number; draw: number; alpha: number;
}> = ({ uid, edge, was, a, b, t, draw, alpha }) => {
  const s = edgeSegment(a, b);
  const from = was?.style ?? "idle";
  const col = mixHex(edgeColor(from), edgeColor(edge.style), t);
  const markerKey = edge.style === "bad" ? "clay" : edge.style === "active" || edge.style === "compare" ? "terracotta"
    : edge.style === "match" ? "sage" : edge.style === "dim" ? "line" : "muted";
  const x2 = lerp(s.x1, s.x2, draw), y2 = lerp(s.y1, s.y2, draw);

  // label sits off the line, on the side facing up (or right, for a vertical arrow)
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1, len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (Math.abs(ny) > 0.35 ? ny > 0 : nx < 0) { nx = -nx; ny = -ny; }
  const mx = (s.x1 + s.x2) / 2 + nx * 30, my = (s.y1 + s.y2) / 2 + ny * 30;
  const changed = was !== undefined && was.label !== edge.label;

  return (
    <g opacity={alpha}>
      <line x1={s.x1} y1={s.y1} x2={x2} y2={y2} stroke={col}
        strokeWidth={edge.style === "idle" ? 4.5 : 7} strokeLinecap="round"
        strokeDasharray={edge.async ? "14 12" : undefined}
        markerEnd={draw > 0.9 ? `url(#${uid}-ah-${markerKey})` : undefined} />
      {changed && was?.label && <EdgeLabel x={mx} y={my} text={was.label} opacity={1 - fadeIn(t)} hot={false} />}
      {edge.label && (
        <EdgeLabel x={mx} y={my} text={edge.label} hot={edge.style === "bad"}
          opacity={changed || !was ? fadeIn(t, 0.3) : 1}
          scale={changed ? 1 + Math.sin(Math.PI * t) * 0.14 : 1} />
      )}
    </g>
  );
};

const EdgeLabel: React.FC<{ x: number; y: number; text: string; opacity: number; hot: boolean; scale?: number }> = ({
  x, y, text, opacity, hot, scale = 1,
}) => {
  const w = text.length * 14.6 + 26;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <rect x={-w / 2} y={-21} width={w} height={42} rx={21}
        fill={hot ? palette.clay : "#FBF5EC"} stroke={hot ? palette.clay : palette.line} strokeWidth={2.5} />
      <text textAnchor="middle" dominantBaseline="central" fill={hot ? "#FFEDE7" : palette.inkSoft}
        style={{ fontFamily: monoFamily, fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{text}</text>
    </g>
  );
};

/** Box outline: a cylinder for a store, a rounded card for everything else. */
function outline(kind: string, w: number, h: number): string {
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  if (kind === "store") {
    const ry = Math.min(16, h * 0.14);
    return `M ${x0} ${y0 + ry} A ${w / 2} ${ry} 0 0 1 ${x1} ${y0 + ry} L ${x1} ${y1 - ry} A ${w / 2} ${ry} 0 0 1 ${x0} ${y1 - ry} Z`;
  }
  const r = kind === "client" ? Math.min(34, h / 2) : 16;
  return `M ${x0 + r} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1}
    H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r} V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
}

const NodeBox: React.FC<{ node: ArchNode; was?: ArchNode; box: Box; t: number; enter: number }> = ({
  node, was, box, t, enter,
}) => {
  const a = styleColors[was?.style ?? "idle"] ?? styleColors.idle;
  const b = styleColors[node.style] ?? styleColors.idle;
  const bg = mixHex(a.bg, b.bg, t), fg = mixHex(a.fg, b.fg, t), bd = mixHex(a.border, b.border, t);
  const { w, h } = box;
  const d = outline(node.kind, w, h);
  const reps = node.replicas, wasReps = was?.replicas ?? reps;
  const layers = Math.min(3, reps) - 1;
  const repsChanged = reps !== wasReps;
  const repText = `×${reps}${node.noun ? ` ${node.noun}` : ""}`;
  const fs = Math.min(31, w / 8.6, h / 3.2);
  const accent = kindAccent[node.kind] ?? palette.muted;
  const plain = node.style === "idle" || node.style === "dim";
  const ry = node.kind === "store" ? Math.min(16, h * 0.14) : 0;

  return (
    <g transform={`translate(${box.x},${box.y}) scale(${Math.max(0.01, enter)})`} opacity={Math.min(1, enter * 1.3)}>
      {/* the stack behind a replicated box */}
      {Array.from({ length: layers }, (_, i) => layers - i).map((k) => (
        <path key={k} d={d} transform={`translate(${k * 11},${k * 11})`}
          fill={mixHex("#F7EFE5", "#EADBC8", 0.5)} stroke={palette.line} strokeWidth={3}
          opacity={repsChanged && wasReps <= k ? fadeIn(t) : 1} />
      ))}
      <path d={d} fill={bg} stroke={bd} strokeWidth={4} />
      {node.kind === "store" && (
        <path d={`M ${-w / 2} ${-h / 2 + ry} A ${w / 2} ${ry} 0 0 0 ${w / 2} ${-h / 2 + ry}`} fill="none" stroke={bd} strokeWidth={3} />
      )}
      {node.kind === "queue" && [0, 1, 2].map((i) => (
        <line key={i} x1={w / 2 - 20 - i * 14} x2={w / 2 - 20 - i * 14} y1={-h / 2 + 14} y2={h / 2 - 14}
          stroke={bd} strokeWidth={3} opacity={0.6} />
      ))}
      {plain && node.kind !== "store" && (
        <rect x={-w / 2 + 10} y={-h / 2 + 14} width={7} height={h - 28} rx={3.5} fill={accent} opacity={0.9} />
      )}
      <text y={node.sub ? -fs * 0.35 + ry * 0.4 : ry * 0.4} textAnchor="middle" dominantBaseline="central" fill={fg}
        style={{ fontFamily: displayFamily, fontSize: fs, fontWeight: 700 }}>{node.label}</text>
      {node.sub && (
        <text y={fs * 0.72 + ry * 0.4} textAnchor="middle" dominantBaseline="central" fill={fg} opacity={0.7}
          style={{ fontFamily: monoFamily, fontSize: fs * 0.64, fontWeight: 600 }}>{node.sub}</text>
      )}
      {reps > 1 && (
        // bottom-left: clear of the bottleneck pill above, the arrows leaving the right edge,
        // and the request token that hangs below the centre
        <g transform={`translate(${-w / 2 + badgeW(repText) / 2 - 8}, ${h / 2 + layers * 11 + 12}) scale(${repsChanged ? pop(t) : 1})`}>
          <ReplicaBadge text={repText} />
        </g>
      )}
    </g>
  );
};

const badgeW = (text: string) => text.length * 16 + 30;
const ReplicaBadge: React.FC<{ text: string }> = ({ text }) => {
  const w = badgeW(text);
  return (
    <g>
      <rect x={-w / 2} y={-23} width={w} height={46} rx={23} fill={palette.indigo} stroke="#FFF6EC" strokeWidth={3} />
      <text textAnchor="middle" dominantBaseline="central" fill="#EEF2F9"
        style={{ fontFamily: monoFamily, fontSize: 26, fontWeight: 800 }}>{text}</text>
    </g>
  );
};

/**
 * The persistent object. One marker per diagram: a red ring on the box that breaks next,
 * and a pill above it saying by how much. When it moves, it travels.
 */
const BottleneckMarker: React.FC<{
  prev: ArchState; next: ArchState; boxOf: (id: string) => Box | undefined; t: number; slideIndex: number;
}> = ({ prev, next, boxOf, t, slideIndex }) => {
  const a = prev.bottleneck, b = next.bottleneck;
  const e = Easing.inOut(clamp01(t));
  const els: React.ReactNode[] = [];

  const ring = (id: string, alpha: number, key: string) => {
    const bx = boxOf(id);
    if (!bx || alpha <= 0) return;
    const pulse = 1 + Math.sin(Math.PI * clamp01(t)) * 0.05;
    els.push(
      <rect key={key} x={bx.x - bx.w / 2 - 12} y={bx.y - bx.h / 2 - 12} width={bx.w + 24} height={bx.h + 24} rx={24}
        fill="none" stroke={palette.clay} strokeWidth={6} strokeDasharray="18 10" opacity={alpha}
        transform={`translate(${bx.x},${bx.y}) scale(${pulse}) translate(${-bx.x},${-bx.y})`} />,
    );
  };
  const pill = (x: number, y: number, text: string, alpha: number, scale: number, key: string, color: string, fg: string, icon: string) => {
    const w = text.length * 15.4 + 70;
    els.push(
      <g key={key} transform={`translate(${x},${y}) scale(${Math.max(0.01, scale)})`} opacity={alpha}>
        <rect x={-w / 2} y={-26} width={w} height={52} rx={26} fill={color} />
        <text x={-w / 2 + 28} textAnchor="middle" dominantBaseline="central" fill={fg}
          style={{ fontFamily: displayFamily, fontSize: 28, fontWeight: 800 }}>{icon}</text>
        <text x={16} textAnchor="middle" dominantBaseline="central" fill={fg}
          style={{ fontFamily: monoFamily, fontSize: 26, fontWeight: 700 }}>{text}</text>
      </g>,
    );
  };
  const above = (id: string) => { const bx = boxOf(id); return bx ? { x: bx.x, y: bx.y - bx.h / 2 - 48 } : undefined; };

  if (b) {
    const to = above(b.id);
    const from = a ? above(a.id) : undefined;
    if (to) {
      const moving = a && a.id !== b.id && from;
      const x = moving ? lerp(from!.x, to.x, e) : to.x, y = moving ? lerp(from!.y, to.y, e) : to.y;
      if (moving) ring(a!.id, 1 - fadeIn(t), "ring-a");
      ring(b.id, a && a.id === b.id ? 1 : fadeIn(t), "ring-b");
      pill(x, y, b.text, a ? 1 : fadeIn(t), a ? 1 : pop(t), "pill", palette.clay, "#FFEDE7", "!");
    }
  } else if (a) {
    const at = above(a.id);
    ring(a.id, 1 - fadeIn(t), "ring-a");
    if (at) pill(at.x, at.y, a.text, 1 - fadeIn(t), 1, "pill", palette.clay, "#FFEDE7", "!");
  }

  // a fix lands: a check where the marker was, for this slide only
  const r = next.resolved;
  if (r && r.born === slideIndex) {
    const at = above(r.id);
    if (at) pill(at.x, at.y, r.text ?? "fixed", fadeIn(t, 0.25), pop(clamp01((t - 0.2) / 0.8)), "ok", palette.sage, "#F4FBEF", "✓");
  }
  return <>{els}</>;
};
