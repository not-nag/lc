"use client";
import React, { useMemo } from "react";
import type { Deck } from "@/schema";
import { cachedDeckStates, fadeIn, settle } from "@/engine";
import { VIEWS } from "@/views";
import { StepLabel, Callout, Aside, Formula, ResultBanner, TitleCard } from "@/primitives";
import { palette } from "@/theme";
import { flatten, STAGE } from "@/schema/deck";

/** Renders one slide of a deck at animation progress `t`. */
export const SlideView: React.FC<{
  deck: Deck; index: number; t: number; width: number; height: number;
  onEdit?: (path: EditPath, value: string) => void;
}> = ({ deck, index, t, width, height, onEdit }) => {
  const cursors = useMemo(() => flatten(deck), [deck]);
  const cur = cursors[Math.max(0, Math.min(index, cursors.length - 1))];
  const section = deck.sections[cur.section];
  const slide = section.slides[cur.slide];

  const { padTop: PAD_TOP, padBottom: PAD_BOTTOM } = STAGE[deck.meta.format];
  const states = cachedDeckStates(deck);
  const prev = states[cur.index] ?? states[0];
  const next = states[cur.index + 1] ?? prev;
  const p = settle(t);

  if (section.kind === "hook" && section.layout.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <TitleCard number={deck.meta.number} title={deck.meta.title} difficulty={deck.meta.difficulty}
          kicker="LeetCode in 100s" progress={0.55 + 0.45 * fadeIn(t)} />
        <StepLabel text={slide.label} progress={1} onEdit={onEdit ? (v: string) => onEdit({ kind: "label", index: cur.index }, v) : undefined} />
      </div>
    );
  }

  const rows = Math.max(1, section.rows);
  const stageH = height - PAD_TOP - PAD_BOTTOM;
  const sizes = section.rowSizes?.length === rows ? section.rowSizes : Array(rows).fill(1);
  const sum = sizes.reduce((a, b) => a + b, 0);
  const heightOf = (row: number, span: number) =>
    (sizes.slice(row, row + span).reduce((a, b) => a + b, 0) / sum) * stageH - 14;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Header deck={deck} section={section.title ?? labelFor(section.kind)} />

      <div style={{
        position: "absolute", top: PAD_TOP, left: 0, right: 0, height: stageH,
        display: "grid", gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: section.rowSizes?.length === rows
          ? section.rowSizes.map((f) => `${f}fr`).join(" ") : `repeat(${rows}, min-content)`,
        alignContent: "center", gap: 14, padding: "0 32px",
      }}>
        {section.layout.map((pane) => {
          const decl = deck.views.find((v) => v.id === pane.view);
          const Comp = decl && VIEWS[decl.kind];
          if (!decl || !Comp) return null;
          return (
            <div key={pane.view} style={{
              gridColumn: `${pane.col + 1} / span ${pane.span}`,
              gridRow: `${pane.row + 1} / span ${pane.rowSpan}`,
              display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0,
            }}>
              <Comp prev={prev.views[pane.view]} next={next.views[pane.view]} t={p}
                slideIndex={cur.index} width={((width - 64) * pane.span) / 12 - 16}
                height={heightOf(pane.row, pane.rowSpan)} label={decl.label} />
            </div>
          );
        })}
      </div>

      {next.overlay.formula && <Formula text={next.overlay.formula.text} progress={fadeIn(t)} top={PAD_TOP + stageH - 40} />}
      {next.overlay.callout && <Callout text={next.overlay.callout.text} variant={next.overlay.callout.variant} progress={fadeIn(t)} top={112} />}
      {next.overlay.aside && <Aside text={next.overlay.aside.text} progress={fadeIn(t)} bottom={PAD_BOTTOM + 58} />}
      {next.overlay.result && <ResultBanner value={next.overlay.result.value} label={next.overlay.result.label} progress={fadeIn(t)} />}

      <StepLabel text={slide.label} progress={1} deckProgress={(cur.index + 1) / cursors.length}
        onEdit={onEdit ? (v: string) => onEdit({ kind: "label", index: cur.index }, v) : undefined} />
    </div>
  );
};

export type EditPath = { kind: "label" | "note"; index: number };

const labelFor = (k: string) => (({
  problem: "The problem", walkthrough: "Walkthrough", code: "Code",
  intuition: "Intuition", hook: "", custom: "",
}) as Record<string, string>)[k] ?? "";

const Header: React.FC<{ deck: Deck; section: string }> = ({ deck, section }) => (
  <div style={{ position: "absolute", top: 46, left: 36, right: 36, display: "flex", justifyContent: "space-between" }}>
    <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: palette.muted }}>
      {deck.meta.number ? `#${deck.meta.number} · ` : ""}{deck.meta.title}
    </div>
    <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: palette.terracotta }}>
      {section}
    </div>
  </div>
);
