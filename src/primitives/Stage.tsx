import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "@/theme";
import { interFamily } from "./fonts";

/** The canvas every scene paints on: warm paper with a soft vignette + grain. */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: palette.bg, fontFamily: interFamily, color: palette.ink }}>
    <AbsoluteFill style={{
      background: `radial-gradient(120% 80% at 50% 8%, ${palette.surfaceAlt} 0%, ${palette.bg} 45%, ${palette.bgDeep} 100%)`,
    }} />
    <AbsoluteFill style={{ opacity: 0.045, mixBlendMode: "multiply", backgroundImage: GRAIN, backgroundSize: "180px 180px" }} />
    <AbsoluteFill>{children}</AbsoluteFill>
  </AbsoluteFill>
);

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")";
