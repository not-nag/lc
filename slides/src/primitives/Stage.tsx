import React from "react";
import { palette } from "@/theme";
import { interFamily } from "./fonts";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")";

const fill: React.CSSProperties = { position: "absolute", inset: 0 };

/** The canvas every slide paints on: warm paper with a soft vignette and grain. */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ ...fill, background: palette.bg, fontFamily: interFamily, color: palette.ink, overflow: "hidden" }}>
    <div style={{ ...fill,
      background: `radial-gradient(120% 80% at 50% 8%, ${palette.surfaceAlt} 0%, ${palette.bg} 45%, ${palette.bgDeep} 100%)` }} />
    <div style={{ ...fill, opacity: 0.045, mixBlendMode: "multiply", backgroundImage: GRAIN, backgroundSize: "180px 180px" }} />
    <div style={fill}>{children}</div>
  </div>
);
