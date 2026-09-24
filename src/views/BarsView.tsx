import React from "react";
import { Panel, Pointer } from "@/primitives";
import { monoFamily, interFamily } from "@/primitives/fonts";
import { palette, styleColors, radius } from "@/theme";
import { mixHex } from "@/engine/tween";
import type { ArrayState } from "@/engine/state";
import type { Style } from "@/schema/ops";
import type { ViewProps } from "./types";

/** Value labels sit above the bar, so they need their own readable colour per style. */
const labelColor = (st: Style) =>
  st === "dim" ? "#B7A697"
  : st === "active" || st === "match" || st === "bad" || st === "visited" ? styleColors[st].bg
  : palette.inkSoft;

/**
 * A price chart. Height carries the meaning, so the shape of the data is readable
 * at a glance — which numbers in boxes never are.
 */
export const BarsView: React.FC<ViewProps<ArrayState> & { unit?: string }> = ({
  prev, next, t, width, height, label,
}) => {
  const n = Math.max(next.cells.length, 1);
  const w = Math.min(width, 980);
  const chartH = Math.max(280, height - 150);
  const gap = n > 8 ? 12 : 22;
  const barW = Math.max(40, Math.floor((w - gap * (n - 1)) / n));
  const pitch = barW + gap;
  const rowW = n * pitch - gap;

  const vals = next.cells.map((c) => Number(c.value) || 0);
  const max = Math.max(...vals, 1);
  const hOf = (v: number) => Math.max(14, (v / max) * (chartH - 84));
  const xOf = (i: number) => i * pitch + barW / 2;

  const prevStyle = new Map(prev.cells.map((c) => [c.id, c.style]));
  const prevVal = new Map(prev.cells.map((c) => [c.id, Number(c.value) || 0]));

  const levelY = next.level ? chartH - hOf(next.level.value) : 0;
  const prevLevelY = prev.level ? chartH - hOf(prev.level.value) : levelY;
  const lvlY = prev.level ? prevLevelY + (levelY - prevLevelY) * t : levelY;

  return (
    <Panel label={label}>
      <div style={{ position: "relative", width: rowW, height: chartH, marginTop: 92, marginBottom: 58 }}>
        {/* baseline */}
        <div style={{ position: "absolute", left: -14, right: -14, bottom: 0, height: 4, background: palette.line }} />

        {next.cells.map((c, i) => {
          const v = Number(c.value) || 0;
          const pv = prevVal.get(c.id) ?? v;
          const h = hOf(pv + (v - pv) * t);
          const a = styleColors[prevStyle.get(c.id) ?? "idle"] ?? styleColors.idle;
          const b = styleColors[c.style] ?? styleColors.idle;
          return (
            <div key={c.id} style={{ position: "absolute", left: i * pitch, bottom: 0, width: barW }}>
              <div style={{
                position: "absolute", bottom: 0, width: barW, height: h,
                background: mixHex(a.bg, b.bg, t), border: `4px solid ${mixHex(a.border, b.border, t)}`,
                borderRadius: `${radius.cell}px ${radius.cell}px 4px 4px`,
              }} />
              <div style={{
                position: "absolute", bottom: h + 12, width: barW, textAlign: "center",
                fontFamily: monoFamily, fontWeight: 800, fontSize: Math.min(40, barW * 0.44),
                color: mixHex(labelColor(prevStyle.get(c.id) ?? "idle"), labelColor(c.style), t),
                fontVariantNumeric: "tabular-nums",
              }}>{v}</div>
              <div style={{
                position: "absolute", top: chartH + 14, width: barW, textAlign: "center",
                fontFamily: interFamily, fontSize: Math.min(26, barW * 0.3), fontWeight: 600, color: palette.muted,
              }}>{i + 1}</div>
            </div>
          );
        })}

        {next.level && (
          <div style={{ position: "absolute", left: -20, right: -20, top: lvlY, opacity: prev.level ? 1 : t }}>
            <div style={{ borderTop: `5px dashed ${next.level.color}` }} />
            {next.level.label && (
              <div style={{
                position: "absolute", right: 0, top: -48, background: next.level.color, color: "#FFF8F0",
                fontFamily: interFamily, fontWeight: 800, fontSize: 30, borderRadius: 999, padding: "6px 20px",
                whiteSpace: "nowrap",
              }}>{next.level.label}</div>
            )}
          </div>
        )}

        {next.area && (() => {
          const a = next.area!;
          const pa = prev.area ?? a;
          const lerp = (x: number, y: number) => x + (y - x) * t;
          const from = lerp(pa.from, a.from), to = lerp(pa.to, a.to), hv = lerp(pa.height, a.height);
          const x1 = from * pitch, x2 = to * pitch + barW;
          const top = chartH - hOf(hv);
          const ghost = a.style === "ghost";
          return (
            <div key="area" style={{
              position: "absolute", left: x1, top, width: Math.max(0, x2 - x1), height: chartH - top,
              background: ghost ? "transparent" : `${palette.indigo}2E`,
              borderTop: `5px ${ghost ? "dashed" : "solid"} ${palette.indigo}`,
              borderLeft: `4px solid ${palette.indigo}${ghost ? "55" : "AA"}`,
              borderRight: `4px solid ${palette.indigo}${ghost ? "55" : "AA"}`,
              borderRadius: "6px 6px 0 0", opacity: prev.area ? 1 : t,
            }}>
              {a.label && (
                <div style={{
                  position: "absolute", left: "50%", top: 18, transform: "translateX(-50%)",
                  background: palette.indigo, color: "#EEF2F9", fontFamily: monoFamily, fontWeight: 800,
                  fontSize: 36, borderRadius: 12, padding: "8px 20px", whiteSpace: "nowrap",
                }}>{a.label}</div>
              )}
            </div>
          );
        })()}

        {next.gap && next.level && (() => {
          const g = next.gap;
          const top = chartH - hOf(Number(next.cells[g.index]?.value) || 0);
          // sit the measurement just outside the bar so it reads as a ruler, not a fill
          const last = g.index >= n - 1;
          const x = xOf(g.index) + (last ? -barW / 2 - 14 : barW / 2 + 10);
          const p = prev.gap?.index === g.index ? 1 : t;
          return (
            <div key="gap" style={{ position: "absolute", left: x - 3, top, height: Math.max(0, lvlY - top), opacity: p }}>
              <div style={{ width: 6, height: "100%", background: palette.sage, borderRadius: 3 }} />
              {g.label && (
                <div style={{
                  // hang the chip back over its OWN bar — extending outward covers the neighbour
                  position: "absolute", left: last ? 16 : undefined, right: last ? undefined : 16,
                  top: "50%", transform: "translateY(-50%)",
                  background: palette.sage, color: "#F4FBEF", fontFamily: monoFamily, fontWeight: 800,
                  fontSize: 38, borderRadius: 14, padding: "8px 20px", whiteSpace: "nowrap",
                }}>{g.label}</div>
              )}
            </div>
          );
        })()}

        {Object.entries(next.pointers).map(([name, p]) => {
          const was = prev.pointers[name];
          const idx = was ? was.index + (p.index - was.index) * t : p.index;
          const appear = was ? 1 : t;
          return <Pointer key={name} x={xOf(idx)} label={p.label ?? name} color={p.color}
            size={Math.min(110, barW * 1.1)} scale={appear} opacity={appear} />;
        })}
      </div>
    </Panel>
  );
};
