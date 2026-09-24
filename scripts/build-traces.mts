/**
 * Compile every traces/*.ts into a validated storyboards/*.json.
 * Trusted path (our own files) — runs them directly, no vm.
 */
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { Tracer } from "@/tracer/tracer";
import { safeParseStoryboard, lint, formatIssues, compileStats } from "@/lib/validate";
import { readScript, checkAgainstScript, formatScriptIssues } from "@/lib/narration";

const only = process.argv[2];
if (!existsSync("storyboards")) mkdirSync("storyboards");

const files = readdirSync("traces").filter((f) => f.endsWith(".ts") && (!only || f.includes(only)));
let failed = 0;

for (const f of files) {
  const mod = await import(pathToFileURL(join(process.cwd(), "traces", f)).href);
  const t = new Tracer();
  try { mod.trace(t); }
  catch (e: any) { console.error(`✗ ${f} threw while tracing: ${e?.message}`); failed++; continue; }

  const parsed = safeParseStoryboard(t.build(mod.meta));
  if (!parsed.success) {
    console.error(`✗ ${f} schema:\n${JSON.stringify(parsed.error.issues.slice(0, 6), null, 2)}`);
    failed++; continue;
  }
  const sb = parsed.data;
  const issues = lint(sb);
  const errs = issues.filter((i) => i.level === "error");
  const { seconds, steps } = compileStats(sb);

  // script-first: if the author supplied the words, the trace may not have changed them
  const script = readScript(sb.meta.slug);
  const scriptIssues = script ? checkAgainstScript(sb, script) : [];

  const out = join("storyboards", `${sb.meta.slug}.json`);
  if (errs.length) { console.error(`✗ ${f}\n${formatIssues(errs)}`); failed++; }
  else if (scriptIssues.length) {
    console.error(`✗ ${sb.meta.slug} does not match narration/${sb.meta.slug}.txt:\n${formatScriptIssues(scriptIssues)}`);
    failed++;
  }
  else {
    writeFileSync(out, JSON.stringify(sb, null, 2));
    const warns = issues.filter((i) => i.level === "warn");
    console.log(`✓ ${sb.meta.slug}  ${seconds.toFixed(1)}s  ${sb.scenes.length} scenes  ${steps} steps → ${out}`
      + (script ? `  [script: ${script.length} lines verbatim]` : ""));
    if (warns.length) console.log(formatIssues(warns).split("\n").map((l) => "  " + l).join("\n"));
  }
}
if (failed) { console.error(`\n${failed} trace(s) failed`); process.exit(1); }
