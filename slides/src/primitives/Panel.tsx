import React from "react";
import { palette, radius } from "@/theme";
import { interFamily, displayFamily } from "./fonts";

/** A labelled container for one view. */
export const Panel: React.FC<{
  label?: string; children: React.ReactNode; style?: React.CSSProperties; flush?: boolean;
}> = ({ label, children, style, flush }) => (
  <div style={{
    display: "flex", flexDirection: "column", gap: 10, width: "100%", height: "100%", overflow: "hidden",
    justifyContent: "center", alignItems: "center", position: "relative", ...style,
  }}>
    {label && (
      <div style={{
        fontFamily: displayFamily, fontSize: 40, fontWeight: 600, letterSpacing: 0,
        color: palette.muted,
      }}>{label}</div>
    )}
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", width: "100%",
      ...(flush ? {} : { padding: 8 }),
    }}>{children}</div>
  </div>
);

export const Surface: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: palette.surfaceAlt, border: `3px solid ${palette.line}`, borderRadius: radius.panel,
    padding: 24, boxShadow: `0 10px 0 -4px ${palette.bgDeep}`, ...style,
  }}>{children}</div>
);
