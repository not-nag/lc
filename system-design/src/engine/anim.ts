/**
 * The animation primitives, without Remotion. Everything a view draws is a function
 * of `t` (0 → 1) between the previous slide's state and this one's — the deck drives
 * that number with requestAnimationFrame instead of a frame counter.
 */

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Easing = {
  linear: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

/** Step response of a damped spring, normalised so t=1 has settled. */
export function spring(t: number, { damping = 14, stiffness = 220, mass = 0.6 } = {}) {
  const x = clamp01(t) * 1.15;            // most of the motion is done before t=1
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const s = x * 0.55;                     // seconds of simulated time across the transition
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * s) * (Math.cos(wd * s) + ((zeta * w0) / wd) * Math.sin(wd * s));
  }
  return 1 - (1 + w0 * s) * Math.exp(-w0 * s);
}

/** Snappier, with a touch of overshoot — for things appearing. */
export const pop = (t: number) => spring(t, { damping: 11, stiffness: 340, mass: 0.42 });

/** Colour blend between two hex strings. */
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const c = (x: number, y: number) => Math.round(lerp(x, y, clamp01(t))).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/** Arc offset for a swap — cells travel over each other, never through. */
export const arc = (t: number, height: number) => -Math.sin(Math.PI * clamp01(t)) * height;

export const fadeIn = (t: number, from = 0) =>
  clamp01((clamp01(t) - from) / (1 - from));

export function interpolate(x: number, inRange: [number, number], outRange: [number, number],
                            ease: (t: number) => number = Easing.linear) {
  const [a, b] = inRange, [c, d] = outRange;
  return lerp(c, d, ease(clamp01((x - a) / (b - a || 1))));
}

/** Entry animation for something created on the slide now being shown. */
export const enter = (slideIndex: number, born: number, t: number) =>
  slideIndex === born ? pop(t) : 1;

/** How far a change on this slide has settled. */
export const settle = (t: number) => spring(t);
