import type { Storyboard } from "@/schema";
import { motion } from "@/theme";

export type StepSlot = { index: number; from: number; to: number; beats: number; stretched: boolean };

/** Reading rate for a short on-screen label, characters per second. */
const CPS = 19;
const MIN_LABEL_S = 0.7;
const MAX_LABEL_S = 2.4;

/**
 * A step never runs shorter than its label takes to read. Labels are terse, so this
 * floor keeps the video snappy while staying legible on a phone.
 */
export function labelFrames(label: string | undefined, fps: number) {
  if (!label) return 0;
  const s = Math.min(MAX_LABEL_S, Math.max(MIN_LABEL_S, label.length / CPS + 0.25));
  return Math.round(s * fps);
}

/** Short-form delivery rate, words per second (~177 wpm). Reels pace, not podcast pace. */
const WPS = 2.95;
const MAX_SPEECH_S = 8.5;

/**
 * A step also never runs shorter than its narration takes to SAY. Without this the
 * script and the picture drift apart and the voiceover can't be recorded to the cut.
 */
export function speechFrames(voice: string | undefined, fps: number) {
  if (!voice?.trim()) return 0;
  const words = voice.trim().split(/\s+/).length;
  return Math.round(Math.min(MAX_SPEECH_S, words / WPS + 0.22) * fps);
}
export type SceneSlot = {
  index: number; id: string; kind: string;
  from: number; durationInFrames: number; steps: StepSlot[];
};
export type Timeline = {
  fps: number; width: number; height: number;
  totalFrames: number; seconds: number; scenes: SceneSlot[];
};

/** Beats → frames. Nothing downstream ever sees a beat. */
export function compile(sb: Storyboard): Timeline {
  const { fps, framesPerBeat } = sb.meta;
  let cursor = 0;
  const scenes: SceneSlot[] = sb.scenes.map((sc, i) => {
    let local = 0;
    const steps: StepSlot[] = sc.steps.map((st, j) => {
      const want = Math.max(1, Math.round(st.beats * framesPerBeat));
      const floor = Math.max(labelFrames(st.label, fps), speechFrames(st.voice, fps));
      const len = Math.max(want, floor);
      const slot = { index: j, from: local, to: local + len, beats: st.beats, stretched: len > want };
      local += len;
      return slot;
    });
    // hold the last state briefly so a scene never cuts mid-motion
    local += 5;
    const slot: SceneSlot = { index: i, id: sc.id, kind: sc.kind, from: cursor, durationInFrames: local, steps };
    cursor += local;
    return slot;
  });
  return { fps, width: sb.meta.width, height: sb.meta.height, totalFrames: Math.max(1, cursor), seconds: cursor / fps, scenes };
}

/** Which step are we in, and how far through its transition (0..1, raw). */
export function locate(scene: SceneSlot, localFrame: number) {
  let idx = scene.steps.length - 1;
  for (let i = 0; i < scene.steps.length; i++) {
    if (localFrame < scene.steps[i].to) { idx = i; break; }
  }
  const st = scene.steps[idx];
  const into = localFrame - st.from;
  return { stepIndex: idx, into, length: st.to - st.from };
}
