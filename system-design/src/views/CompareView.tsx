import React from "react";
import { Panel } from "@/primitives";
import { monoFamily, displayFamily } from "@/primitives/fonts";
import { palette, radius } from "@/theme";
import { enter, fadeIn, pop, clamp01 } from "@/engine/anim";
import type { CompareState } from "@/engine/state";
import type { ViewProps } from "./types";

const tones = {
  good: { bg: "#E3EDD9", fg: "#3F5E2E", border: "#A9C49A", mark: "✓" },
  bad:  { bg: "#F5DDD5", fg: "#7E3423", border: "#DDA898", mark: "✗" },
  meh:  { bg: "#F7EFE5", fg: palette.inkSoft, border: palette.line, mark: "" },
} as const;

/**
 * Options side by side, one row per axis. Rows arrive one per slide; a pick outlines the
 * chosen column and dims the rest.
 */
export const CompareView: React.FC<ViewProps<CompareState>> = ({ prev, next, t, slideIndex, width, height, label }) => {
  const n = next.options.length;
  const w = Math.min(width, 1760);
  const axisW = Math.round(w * 0.2);
  const colW = (w - axisW - 14 * n) / n;
  const rows = next.rows.length;
  const headH = 104;
  const rowH = Math.max(64, Math.min(96, (height - (label ? 60 : 0) - headH - 90 - rows * 10) / Math.max(4, rows)));
  const fs = Math.min(31, rowH * 0.36, colW / 11);

  const pick = next.pick, was = prev.pick;
  const pickAlpha = (id: string) => {
    const on = pick?.option === id, before = was?.option === id;
    return on && before ? 1 : on ? fadeIn(t) : before ? 1 - fadeIn(t) : 0;
  };
  const anyPick = pick ? (was ? 1 : fadeIn(t)) : was ? 1 - fadeIn(t) : 0;

  return (
    <Panel label={label}>
      <div style={{ width: w, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: `${axisW}px repeat(${n}, 1fr)`, gap: 14, height: headH }}>
          <div />
          {next.options.map((o) => {
            const pa = pickAlpha(o.id);
            return (
              <div key={o.id} style={{
                display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center",
                paddingBottom: 10, borderBottom: `5px solid ${pa > 0.01 ? palette.terracotta : palette.line}`,
                opacity: 1 - anyPick * (1 - pa) * 0.55,
              }}>
                <div style={{ fontFamily: displayFamily, fontSize: Math.min(40, colW / 8), fontWeight: 800, color: palette.ink,
                  whiteSpace: "nowrap" }}>{o.title}</div>
                {o.sub && <div style={{ fontFamily: monoFamily, fontSize: Math.min(22, colW / 15), fontWeight: 600,
                  color: palette.muted }}>{o.sub}</div>}
              </div>
            );
          })}
        </div>

        {next.rows.map((r, ri) => {
          const s = enter(slideIndex, r.born, t);
          return (
            <div key={ri} style={{
              display: "grid", gridTemplateColumns: `${axisW}px repeat(${n}, 1fr)`, gap: 14, height: rowH,
              opacity: Math.min(1, s * 1.2), transform: `translateY(${(1 - Math.min(1, s)) * 14}px)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
                fontFamily: displayFamily, fontSize: fs * 0.92, fontWeight: 700, color: palette.muted, textAlign: "right",
                lineHeight: 1.1 }}>{r.axis}</div>
              {r.cells.map((c, ci) => {
                const tn = tones[c.tone] ?? tones.meh;
                const pa = pickAlpha(next.options[ci].id);
                return (
                  <div key={ci} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    background: tn.bg, color: tn.fg, border: `3px solid ${pa > 0.01 ? palette.terracotta : tn.border}`,
                    borderRadius: radius.cell + 4, padding: "0 16px",
                    fontFamily: displayFamily, fontSize: fs, fontWeight: 700, textAlign: "center", lineHeight: 1.15,
                    opacity: 1 - anyPick * (1 - pa) * 0.55,
                  }}>
                    {tn.mark && <span style={{ fontFamily: monoFamily, fontWeight: 800, opacity: 0.8 }}>{tn.mark}</span>}
                    <span>{c.text}</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div style={{ height: 72, display: "grid", gridTemplateColumns: `${axisW}px repeat(${n}, 1fr)`, gap: 14 }}>
          <div />
          {next.options.map((o) => {
            const on = pick?.option === o.id ? pick : was?.option === o.id ? was : undefined;
            const pa = pickAlpha(o.id);
            if (!on || pa <= 0) return <div key={o.id} />;
            const grow = pick?.option === o.id && was?.option !== o.id ? pop(clamp01(t)) : 1;
            return (
              <div key={o.id} style={{ display: "flex", justifyContent: "center", alignItems: "center", opacity: pa }}>
                <span style={{
                  fontFamily: displayFamily, fontSize: Math.min(28, colW / 13), fontWeight: 800, color: "#FFF6EC",
                  background: palette.terracotta, borderRadius: 999, padding: "8px 24px", whiteSpace: "nowrap",
                  transform: `scale(${grow})`,
                }}>{on.text ?? "pick"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};
