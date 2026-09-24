import { safeParseStoryboard, lint, formatIssues, hasErrors, type Storyboard } from "@/schema";
import { compile } from "@/engine/compile";

export { safeParseStoryboard, lint, formatIssues, hasErrors };

export function compileStats(sb: Storyboard) {
  const tl = compile(sb);
  return { seconds: tl.seconds, frames: tl.totalFrames, steps: sb.scenes.reduce((n, s) => n + s.steps.length, 0) };
}

/** One call: parse + lint + timing. Used by the CLI, the API and the studio. */
export function validate(raw: unknown, maxSeconds = 100) {
  const parsed = safeParseStoryboard(raw);
  if (!parsed.success)
    return { ok: false as const, stage: "schema" as const, issues: [], report: JSON.stringify(parsed.error.issues.slice(0, 8), null, 2) };
  const issues = lint(parsed.data, { maxSeconds });
  return {
    ok: !hasErrors(issues), stage: "lint" as const, storyboard: parsed.data,
    issues, report: formatIssues(issues), stats: compileStats(parsed.data),
  };
}
