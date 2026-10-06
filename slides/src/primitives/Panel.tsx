import React from "react";
import { palette, radius } from "@/theme";
import { interFamily, displayFamily } from "./fonts";

/** A labelled container for one view. */
export const Panel: React.FC<{
  label?: string; children: React.ReactNode; style?: React.CSSProperties; flush?: boolean;
}> = ({ label, children, style, flush }) => (
  <div style={{
    display: "flex", flexDirection: "column", gap: 10, width: "100%", height: "100%", overflow: "hidden",
    alignItems: "center", position: "relative", ...style,
  }}>
    {label && (
      <div style={{
        flexShrink: 0,
        fontFamily: displayFamily, fontSize: 40, fontWeight: 600, letterSpacing: 0,
        color: palette.muted,
      }}>{label}</div>
    )}
    <div style={{
      flex: 1, minHeight: 0, display: "flex", justifyContent: "center", alignItems: "center", width: "100%",
      ...(flush ? {} : { padding: 8 }),
    }}>{children}</div>
  </div>
);
