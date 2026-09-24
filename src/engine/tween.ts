import { spring, interpolate, Easing } from "remotion";
import { springs, motion } from "@/theme";

/** 0→1 progress for the change happening at `into` frames into the current step. */
export function settle(into: number, fps: number, preset: keyof typeof springs = "snap") {
  return spring({ frame: into, fps, config: springs[preset], durationInFrames: motion.settle + 6 });
}

/** Entry animation for an element created at `born`. */
export function enter(currentStep: number, born: number, into: number, fps: number) {
  if (currentStep !== born) return 1;
  return spring({ frame: into, fps, config: springs.pop, durationInFrames: motion.enter + 4 });
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Mix two hex colours. */
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const c = (x: number, y: number) => Math.round(lerp(x, y, Math.max(0, Math.min(1, t)))).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/** Arc offset for a swap — cells travel over/under each other, never through. */
export function arc(t: number, height: number) {
  return -Math.sin(Math.PI * Math.max(0, Math.min(1, t))) * height;
}

export function fadeIn(into: number, frames: number = motion.enter) {
  return interpolate(into, [0, frames], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
}
