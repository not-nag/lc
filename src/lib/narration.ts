import { readFileSync, existsSync } from "node:fs";
import type { Storyboard } from "@/schema";

/**
 * Script-first mode. When narration/<slug>.txt exists it is the author's own words,
 * and the trace may only choose VISUALS — every t.say() must be a verbatim line from
 * the script, in order. This check makes that enforceable instead of merely requested.
 *
 * Format: one spoken line per line. Blank lines and lines starting with # are ignored.
 */
export function readScript(slug: string): string[] | null {
  const path = `narration/${slug}.txt`;
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8")
    .split("\n").map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

/** Loose enough to ignore whitespace and smart quotes; strict about the actual words. */
const norm = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
   .replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

export type ScriptIssue = { index: number; expected?: string; got?: string; message: string };

export function checkAgainstScript(sb: Storyboard, script: string[]): ScriptIssue[] {
  const spoken: string[] = [];
  for (const sc of sb.scenes) for (const st of sc.steps) if (st.voice?.trim()) spoken.push(st.voice.trim());

  const issues: ScriptIssue[] = [];
  const n = Math.max(spoken.length, script.length);
  for (let i = 0; i < n; i++) {
    const want = script[i], got = spoken[i];
    if (want === undefined) { issues.push({ index: i, got, message: `extra narration not in the script` }); continue; }
    if (got === undefined) { issues.push({ index: i, expected: want, message: `script line never spoken` }); continue; }
    if (norm(want) !== norm(got))
      issues.push({ index: i, expected: want, got, message: `narration was reworded` });
  }
  return issues;
}

export function formatScriptIssues(issues: ScriptIssue[]) {
  return issues.map((i) =>
    `  line ${i.index + 1}: ${i.message}` +
    (i.expected ? `\n    script: ${i.expected}` : "") +
    (i.got ? `\n    trace : ${i.got}` : "")
  ).join("\n");
}
