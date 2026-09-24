/** Earthy / warm palette. Single source of truth for video + website. */
export const palette = {
  bg:        "#F2E4D5",
  bgDeep:    "#E8D5C0",
  surface:   "#EADBC8",
  surfaceAlt:"#F7EFE5",
  ink:       "#3E2C23",
  inkSoft:   "#5A4336",
  muted:     "#8A6F5C",
  line:      "#D2BBA3",

  terracotta:"#C1663F",
  olive:     "#6B7A4B",
  mustard:   "#D9A441",
  clay:      "#A2452F",
  sage:      "#5C8A4A",
  indigo:    "#4A5D7E",
} as const;

/** style enum → cell fill / text / border */
export const styleColors: Record<string, { bg: string; fg: string; border: string }> = {
  idle:    { bg: "#F7EFE5", fg: palette.ink,     border: palette.line },
  compare: { bg: "#F6E2C8", fg: "#7A4A1E",       border: palette.mustard },
  active:  { bg: palette.terracotta, fg: "#FFF6EC", border: "#9E4E2E" },
  match:   { bg: palette.sage,       fg: "#F4FBEF", border: "#43682F" },
  bad:     { bg: palette.clay,       fg: "#FFEDE7", border: "#7E3423" },
  window:  { bg: "#E6EBD8", fg: "#3F4B2A",       border: palette.olive },
  done:    { bg: "#E3D8CB", fg: palette.muted,    border: palette.line },
  visited: { bg: "#DCD3E4", fg: "#43355A",       border: "#9B8BB4" },
  dim:     { bg: "#EFE6DB", fg: "#B0A093",       border: "#E0D3C4" },
};

export const pointerColors = {
  primary:   palette.terracotta,
  secondary: palette.olive,
  accent:    palette.mustard,
  success:   palette.sage,
  danger:    palette.clay,
} as const;

export const font = {
  display: '"Bricolage Grotesque", "Inter", system-ui, sans-serif',
  body:    '"Inter", system-ui, -apple-system, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

/** Fast-but-not-twitchy. Arrives quickly with a hair of overshoot. */
export const springs = {
  snap:  { damping: 13, stiffness: 300, mass: 0.5 },
  pop:   { damping: 11, stiffness: 340, mass: 0.42 },
  glide: { damping: 18, stiffness: 140, mass: 0.8 },
} as const;

export const motion = {
  /** how long a visual change takes to settle, in frames */
  settle: 6,
  enter: 8,
  exit: 5,
  transitionFrames: 5,
} as const;

/** The stage's paper. Shared so letterboxing in fullscreen matches the slide exactly. */
export const stageBackground =
  `radial-gradient(120% 80% at 50% 8%, ${palette.surfaceAlt} 0%, ${palette.bg} 45%, ${palette.bgDeep} 100%)`;

export const grainTexture =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")";

export const radius = { cell: 12, panel: 20, pill: 999 } as const;
