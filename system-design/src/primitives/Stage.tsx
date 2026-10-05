import React from "react";
import { palette, stageBackground, grainTexture } from "@/theme";
import { interFamily, displayFamily } from "./fonts";

const fill: React.CSSProperties = { position: "absolute", inset: 0 };

/** The canvas every slide paints on: warm paper with a soft vignette and grain. */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ ...fill, background: palette.bg, fontFamily: displayFamily, color: palette.ink, overflow: "hidden" }}>
    <div style={{ ...fill, background: stageBackground }} />
    <div style={{ ...fill, opacity: 0.045, mixBlendMode: "multiply", backgroundImage: grainTexture, backgroundSize: "180px 180px" }} />
    <div style={fill}>{children}</div>
  </div>
);
