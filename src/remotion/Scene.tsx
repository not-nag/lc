import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate } from "remotion";
import type { Storyboard } from "@/schema";
import { cachedSceneFrames, locate, settle, fadeIn, type SceneSlot } from "@/engine";
import { VIEWS, CUSTOM } from "@/views";
import { StepLabel, Callout, Aside, Formula, ResultBanner, TitleCard } from "@/primitives";
import { palette } from "@/theme";

const PAD_TOP = 122;
/**
 * Bottom band stays empty even with captions off: it is where a later voiceover
 * caption pass lands, and where the platform's own UI sits on Shorts/Reels.
 */
const PAD_BOTTOM_CLEAN = 200;
const PAD_BOTTOM_BURNED = 268;

export const SceneRenderer: React.FC<{ sb: Storyboard; slot: SceneSlot }> = ({ sb, slot }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scene = sb.scenes[slot.index];

  const frames = useMemo(() => cachedSceneFrames(sb, slot.index), [sb, slot.index]);
  const { stepIndex, into } = locate(slot, frame);
  const prev = frames[stepIndex] ?? frames[0];
  const next = frames[stepIndex + 1] ?? prev;
  const t = settle(into, fps);

  const step = scene.steps[stepIndex];
  const prevStep = scene.steps[stepIndex - 1];
  const labelFresh = !prevStep || prevStep.label !== step.label;
  const showSteps = sb.meta.showSteps;
  const PAD_BOTTOM = showSteps ? PAD_BOTTOM_BURNED : PAD_BOTTOM_CLEAN;

  // title scenes bypass the pane grid entirely
  if (scene.kind === "hook" && scene.layout.length === 0) {
    return (
      <AbsoluteFill>
        {/* never start from nothing — frame 0 is the thumbnail */}
        <TitleCard number={sb.meta.number} title={sb.meta.title} difficulty={sb.meta.difficulty}
          kicker="LeetCode in 100s" progress={0.55 + 0.45 * fadeIn(frame, 12)} />
        {next.overlay.aside && <Aside text={next.overlay.aside.text}
          progress={next.overlay.aside.born === stepIndex ? fadeIn(into) : 1} bottom={PAD_BOTTOM + 58} />}
        {showSteps && <StepLabel text={step.label} progress={labelFresh ? fadeIn(into) : 1} />}
      </AbsoluteFill>
    );
  }

  const zoom = next.overlay.camera?.zoom ?? 1;
  const prevZoom = prev.overlay.camera?.zoom ?? 1;
  const scale = prevZoom + (zoom - prevZoom) * t;

  const rows = Math.max(1, scene.rows);
  const stageH = height - PAD_TOP - PAD_BOTTOM;
  const sizes = scene.rowSizes?.length === rows ? scene.rowSizes : Array(rows).fill(1);
  const sizeSum = sizes.reduce((a, b) => a + b, 0);
  /** actual pixel height of a pane spanning rows [row, row+rowSpan) */
  const heightOf = (row: number, span: number) =>
    (sizes.slice(row, row + span).reduce((a, b) => a + b, 0) / sizeSum) * stageH - 14;

  return (
    <AbsoluteFill>
      <Header sb={sb} scene={scene.title ?? labelFor(scene.kind)} />

      <div style={{
        position: "absolute", top: PAD_TOP, left: 0, right: 0, height: stageH,
        display: "grid", gridTemplateColumns: "repeat(12, 1fr)",
        // Without explicit rowSizes, rows take only the height they need and the whole
        // group centres — stretching them left short content marooned in empty space.
        gridTemplateRows: scene.rowSizes?.length === rows
          ? scene.rowSizes.map((f) => `${f}fr`).join(" ")
          : `repeat(${rows}, min-content)`,
        alignContent: "center",
        gap: 14, padding: "0 32px",
        transform: `scale(${scale})`, transformOrigin: "center center",
      }}>
        {scene.layout.map((pane) => {
          const decl = sb.views.find((v) => v.id === pane.view);
          if (!decl) return null;
          const Comp = VIEWS[decl.kind];
          if (!Comp) return null;
          const paneW = ((width - 64) * pane.span) / 12 - 16;
          const paneH = heightOf(pane.row, pane.rowSpan);
          return (
            <div key={pane.view} style={{
              gridColumn: `${pane.col + 1} / span ${pane.span}`,
              gridRow: `${pane.row + 1} / span ${pane.rowSpan}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: pane.scale !== 1 ? `scale(${pane.scale})` : undefined, minWidth: 0,
            }}>
              <Comp prev={prev.views[pane.view]} next={next.views[pane.view]} t={t}
                stepIndex={stepIndex} into={into} fps={fps}
                width={paneW} height={paneH} label={decl.label} />
            </div>
          );
        })}
      </div>

      {next.overlay.formula && <Formula text={next.overlay.formula.text}
        progress={next.overlay.formula.born === stepIndex ? fadeIn(into) : 1} top={PAD_TOP + stageH - 40} />}
      {next.overlay.callout && <Callout text={next.overlay.callout.text} variant={next.overlay.callout.variant}
        progress={next.overlay.callout.born === stepIndex ? fadeIn(into) : 1} top={112} />}
      {next.overlay.aside && <Aside text={next.overlay.aside.text}
        progress={next.overlay.aside.born === stepIndex ? fadeIn(into) : 1} bottom={PAD_BOTTOM + 58} />}
      {next.overlay.result && <ResultBanner value={next.overlay.result.value} label={next.overlay.result.label}
        progress={next.overlay.result.born === stepIndex ? fadeIn(into, 12) : 1} />}

      {showSteps && <StepLabel text={step.label} progress={labelFresh ? fadeIn(into) : 1} />}
    </AbsoluteFill>
  );
};

const labelFor = (k: string) => ({
  problem: "The problem", brute: "Brute force", insight: "The insight",
  walkthrough: "Walkthrough", complexity: "Complexity", outro: "", hook: "", custom: "",
} as Record<string, string>)[k] ?? "";

const Header: React.FC<{ sb: Storyboard; scene: string }> = ({ sb, scene }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 46, left: 36, right: 36, display: "flex",
      alignItems: "center", justifyContent: "space-between", opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>
      <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: palette.muted }}>
        {sb.meta.number ? `#${sb.meta.number} · ` : ""}{sb.meta.title}
      </div>
      <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: palette.terracotta }}>
        {scene}
      </div>
    </div>
  );
};
