import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { Storyboard } from "@/schema";
import { compile } from "@/engine";
import { Stage } from "@/primitives";
import { palette, motion } from "@/theme";
import { SceneRenderer } from "./Scene";

export const Video: React.FC<{ storyboard: Storyboard }> = ({ storyboard: sb }) => {
  const tl = useMemo(() => compile(sb), [sb]);
  return (
    <Stage>
      {tl.scenes.map((slot) => (
        <Sequence key={slot.id} from={slot.from} durationInFrames={slot.durationInFrames} name={`${slot.index}·${slot.kind}`}>
          <Transition kind={sb.scenes[slot.index].transition} first={slot.index === 0}>
            <SceneRenderer sb={sb} slot={slot} />
          </Transition>
        </Sequence>
      ))}
      <ProgressBar total={tl.totalFrames} />
    </Stage>
  );
};

/** Short, snappy scene entries — never more than ~7 frames of movement. */
const Transition: React.FC<{ kind: string; first: boolean; children: React.ReactNode }> = ({ kind, first, children }) => {
  const frame = useCurrentFrame();
  const d = motion.transitionFrames;
  if (kind === "cut" || first) return <>{children}</>;
  const p = interpolate(frame, [0, d], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const style: React.CSSProperties =
    kind === "fade" ? { opacity: p }
    : kind === "slide" ? { transform: `translateY(${(1 - p) * 70}px)`, opacity: p }
    : { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 0, left: 0, height: 9, background: palette.line, width }}>
      <div style={{ height: "100%", width: (frame / total) * width, background: palette.terracotta }} />
    </div>
  );
};
