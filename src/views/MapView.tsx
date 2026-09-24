import React from "react";
import { Panel, monoFamily, interFamily } from "@/primitives";
import { palette, styleColors, radius } from "@/theme";
import { enter, mixHex } from "@/engine/tween";
import type { MapState } from "@/engine/state";
import type { ViewProps } from "./types";

/** Hash map / set — rows of key→value that grow as the algorithm memoises. */
export const MapView: React.FC<ViewProps<MapState>> = ({ prev, next, t, stepIndex, into, fps, width, label }) => {
  const prevStyle = new Map(prev.entries.map((e) => [e.key, e.style]));
  const cols = next.entries.length > 6 ? 2 : 1;
  const isSet = next.entries.every((e) => e.value === null || e.value === true);

  return (
    <Panel label={label}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ width: Math.min(width, 900), display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
        {next.entries.length === 0 && (
          <div style={{ fontFamily: interFamily, fontSize: 34, color: palette.muted, opacity: 0.6,
            textAlign: "center", padding: 28, border: `3px dashed ${palette.line}`, borderRadius: radius.panel }}>
            empty
          </div>
        )}
        {next.entries.map((e) => {
          const a = styleColors[prevStyle.get(e.key) ?? "idle"] ?? styleColors.idle;
          const b = styleColors[e.style] ?? styleColors.idle;
          const ep = enter(stepIndex, e.born, into, fps);
          return (
            <div key={e.key} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              background: mixHex(a.bg, b.bg, t), border: `4px solid ${mixHex(a.border, b.border, t)}`,
              color: mixHex(a.fg, b.fg, t), borderRadius: radius.cell, padding: "14px 22px",
              fontFamily: monoFamily, fontSize: 40, fontWeight: 700, fontVariantNumeric: "tabular-nums",
              transform: `scale(${0.85 + ep * 0.15})`, opacity: ep,
            }}>
              <span>{e.key}</span>
              {!isSet && <><span style={{ opacity: 0.45, fontSize: 32 }}>→</span><span>{String(e.value)}</span></>}
            </div>
          );
        })}
      </div>
      {next.probe && (
        <div style={{ fontFamily: interFamily, fontWeight: 800, fontSize: 30,
          whiteSpace: "nowrap", color: next.probe.hit ? palette.sage : palette.clay, opacity: t }}>
          {next.probe.hit ? `✓ ${next.probe.key} is here` : `✗ ${next.probe.key} not found`}
        </div>
      )}
      </div>
    </Panel>
  );
};
