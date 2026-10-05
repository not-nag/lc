import React from "react";
import { palette, radius } from "@/theme";
import { monoFamily } from "./fonts";

const KW = /\b(def|return|for|while|if|elif|else|in|not|and|or|None|True|False|class|import|from|let|const|var|function|new|null|true|false|of)\b/g;
/** spec words: HTTP verbs and SQL, uppercase only so prose in a spec isn't painted */
const SPEC = /\b(GET|POST|PUT|PATCH|DELETE|CREATE|TABLE|PRIMARY|KEY|INDEX|UNIQUE|NOT|NULL|SELECT|FROM|WHERE|INSERT|INTO|VALUES|CHAR|VARCHAR|TEXT|BIGINT|INT|TIMESTAMP)\b/g;
const COMMENT = /(^|\s)(--|#|\/\/)\s.*$/g;
const NUM = /\b(\d+)\b/g;
const STR = /(["'`])(?:(?!\1).)*\1/g;

/** Tokenises just enough for readability — not a real parser, and doesn't need to be. */
function highlight(line: string): React.ReactNode[] {
  const marks: { s: number; e: number; c: string }[] = [];
  const scan = (re: RegExp, c: string) => { re.lastIndex = 0; let m; while ((m = re.exec(line))) marks.push({ s: m.index, e: m.index + m[0].length, c }); };
  scan(COMMENT, palette.muted); scan(STR, palette.olive); scan(KW, palette.terracotta); scan(SPEC, palette.terracotta); scan(NUM, palette.indigo);
  marks.sort((a, b) => a.s - b.s);
  const out: React.ReactNode[] = []; let i = 0, k = 0;
  for (const m of marks) {
    if (m.s < i) continue;
    if (m.s > i) out.push(<span key={k++}>{line.slice(i, m.s)}</span>);
    out.push(<span key={k++} style={{ color: m.c, fontWeight: 700 }}>{line.slice(m.s, m.e)}</span>);
    i = m.e;
  }
  if (i < line.length) out.push(<span key={k++}>{line.slice(i)}</span>);
  return out;
}

export const CodePane: React.FC<{
  source: string; lines: number[]; prevLines: number[]; t: number; fontSize?: number; width?: number;
}> = ({ source, lines, prevLines, t, fontSize = 40, width = 960 }) => {
  const rows = source.replace(/\s+$/, "").split("\n");
  // JetBrains Mono advance is ~0.6em; shrink until the longest line fits the gutter-adjusted width
  const longest = Math.max(...rows.map((r) => r.length), 1);
  const fits = Math.floor((width - 96) / (longest * 0.602));
  const fs = Math.max(17, Math.min(fontSize, fits));
  const active = new Set(lines), prev = new Set(prevLines);
  return (
    <div style={{
      background: "#FBF5EC", border: `3px solid ${palette.line}`, borderRadius: radius.panel,
      padding: "22px 10px 22px 0", width: "100%", boxShadow: `0 10px 0 -4px ${palette.bgDeep}`, overflow: "hidden",
    }}>
      {rows.map((ln, i) => {
        const n = i + 1;
        const w = (active.has(n) ? t : 0) + (prev.has(n) ? 1 - t : 0);
        return (
          <div key={i} style={{
            display: "flex", gap: 16, alignItems: "baseline",
            background: w > 0 ? `rgba(193,102,63,${0.16 * w})` : "transparent",
            borderLeft: `6px solid ${w > 0 ? palette.terracotta : "transparent"}`,
            paddingLeft: 16, opacity: 0.45 + 0.55 * Math.max(w, active.size === 0 ? 1 : 0.55),
          }}>
            <span style={{ fontFamily: monoFamily, fontSize: fs * 0.72, color: palette.line, width: 34, textAlign: "right" }}>{n}</span>
            <pre style={{ margin: 0, fontFamily: monoFamily, fontSize: fs, lineHeight: 1.5, color: palette.inkSoft, whiteSpace: "pre" }}>
              {highlight(ln) as any}
            </pre>
          </div>
        );
      })}
    </div>
  );
};
