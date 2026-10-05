import React from "react";
import { CodePane, BigText, Panel } from "@/primitives";
import type { CodeState, TextState } from "@/engine/state";
import type { ViewProps } from "./types";

/** The spec pane: an API signature or table schema, highlightable line by line. */
export const CodeView: React.FC<ViewProps<CodeState>> = ({ prev, next, t, width, height, label }) => {
  const w = Math.min(width, 1100);
  const lineCount = next.source.split("\n").length;
  // also cap by available height so tall listings never overflow their pane
  const byHeight = Math.floor((height - 64 - (label ? 56 : 0)) / (lineCount * 1.5));
  return (
    <Panel label={label}>
      <div style={{ width: w }}>
        <CodePane source={next.source} lines={next.lines} prevLines={prev.lines} t={t} width={w}
          fontSize={Math.max(17, Math.min(44, byHeight))} />
      </div>
    </Panel>
  );
};

export const TextView: React.FC<ViewProps<TextState>> = ({ next, t, width, label }) => (
  <Panel label={label}>
    <div style={{ width: Math.min(width, 1500) }}>
      <BigText title={next.title} body={next.body} variant={next.variant} progress={t} />
    </div>
  </Panel>
);
