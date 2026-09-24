import React from "react";
import { Cell, GAP, Pointer, Bracket, LinkArc, Panel } from "@/primitives";
import { palette } from "@/theme";
import { interFamily } from "@/primitives/fonts";
import { enter, arc } from "@/engine/anim";
import type { ArrayState } from "@/engine/state";
import type { ViewProps } from "./types";

/** Cells keep a stable id, so a swap animates as two cells trading places. */
export const ArrayView: React.FC<ViewProps<ArrayState>> = ({ prev, next, t, slideIndex, width, height, label }) => {
  const n = Math.max(prev.cells.length, next.cells.length, 1);
  const hasLinkEarly = next.links.length > 0;
  // a second pointer renders BELOW the cells and needs its own room
  const anyBelow = hasLinkEarly || Object.keys(next.pointers).length > 1;
  const topPad = hasLinkEarly ? 178 : next.tag ? 150 : 92;
  const botPad = next.window ? 112 : anyBelow ? 104 : 24;
  const chrome = topPad + botPad + 52 + (label ? 46 : 0);
  const byWidth = Math.floor((width - GAP * (n - 1) - 24) / n);
  const byHeight = Math.floor(height - chrome);
  // never shrink below legibility — better to crowd the pane than to be unreadable
  const size = Math.max(72, Math.min(240, byWidth, byHeight));
  const pitch = size + GAP;
  const rowWidth = next.cells.length * pitch - GAP;
  const xOf = (i: number) => i * pitch + size / 2;

  const prevIndex = new Map(prev.cells.map((c, i) => [c.id, i]));
  const prevStyle = new Map(prev.cells.map((c) => [c.id, c.style]));

  // reserve space above for pointers + link arcs, below for brackets
  const hasLink = hasLinkEarly;
  const topReserve = topPad;
  const botReserve = botPad;

  return (
    <Panel label={label}>
      <div style={{ position: "relative", width: rowWidth, height: size + 44,
        marginTop: topReserve, marginBottom: botReserve, display: "flex", gap: GAP }}>
        {next.window && (() => {
          const w = next.window!;
          const pw = prev.window ?? w;
          const from = pw.from + (w.from - pw.from) * t;
          const to = pw.to + (w.to - pw.to) * t;
          return (
            <div key="band" style={{
              position: "absolute", left: from * pitch - 14, top: -18,
              width: (to - from + 1) * pitch - GAP + 28, height: size + 36,
              background: "#5B4A7D14", border: `4px dashed #A493C4`, borderRadius: 22,
              opacity: prev.window ? 1 : t, zIndex: 0,
            }} />
          );
        })()}

        {next.cells.map((c, i) => {
          const was = prevIndex.get(c.id);
          const moving = was !== undefined && was !== i;
          const dx = moving ? (was! - i) * pitch * (1 - t) : 0;
          const dy = moving ? arc(t, size * 0.55) : 0;
          const e = enter(slideIndex, c.born, t);
          return (
            <Cell key={c.id} value={String(c.value)} index={i} showIndex size={size}
              from={(prevStyle.get(c.id) ?? "idle") as any} to={c.style} t={t}
              dx={dx} dy={dy} enter={e} zIndex={moving ? 5 : 1} />
          );
        })}

        {next.window && (() => {
          const w = next.window!;
          const pw = prev.window ?? w;
          const from = pw.from + (w.from - pw.from) * t;
          const to = pw.to + (w.to - pw.to) * t;
          return <Bracket key="win" x={from * pitch} width={(to - from + 1) * pitch - GAP}
            label={w.label} opacity={prev.window ? 1 : t} />;
        })()}

        {next.tag && (() => {
          const g = next.tag!;
          const p = prev.tag?.index === g.index && prev.tag?.text === g.text ? 1 : t;
          const c = g.variant === "have" ? palette.sage : g.variant === "miss" ? palette.muted : palette.terracotta;
          // keep the chip inside the row, but leave its arrow on the cell it describes
          const chipW = g.text.length * 18 + 52;
          const anchor = xOf(g.index);
          const cx = Math.max(chipW / 2, Math.min(rowWidth - chipW / 2, anchor));
          return (
            <div key="tag" style={{
              position: "absolute", left: cx, top: -84,
              transform: `translateX(-50%) scale(${0.82 + p * 0.18})`, opacity: p,
            }}>
              <div style={{
                background: c, color: "#FFF8F0", fontFamily: interFamily, fontWeight: 800,
                fontSize: 34, borderRadius: 999, padding: "8px 24px", whiteSpace: "nowrap",
                textAlign: "center",
              }}>{g.text}</div>
              <div style={{
                position: "absolute", left: anchor - cx, bottom: -13, transform: "translateX(-50%)",
                width: 0, height: 0, borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent", borderTop: `13px solid ${c}`,
              }} />
            </div>
          );
        })()}

        {next.links.map((l, i) => (
          <LinkArc key={i} x1={xOf(l.a)} x2={xOf(l.b)} label={l.label}
            progress={prev.links.length > i ? 1 : t} />
        ))}

        {Object.entries(next.pointers).map(([name, p], k) => {
          const was = prev.pointers[name];
          const idx = was ? was.index + (p.index - was.index) * t : p.index;
          const appear = was ? 1 : t;
          return <Pointer key={name} x={xOf(idx)} label={p.label ?? name} color={p.color} size={size}
            scale={appear} opacity={appear} below={hasLink || k % 2 === 1} />;
        })}
      </div>
    </Panel>
  );
};
