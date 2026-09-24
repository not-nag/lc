/**
 * Executes a tracer script in a vm with a hard timeout and prints the resulting
 * storyboard as JSON. Run as a child process so a runaway script can be killed.
 * Usage: echo '{"code":"...","meta":{...}}' | tsx scripts/run-trace.ts
 */
import vm from "node:vm";
import { Tracer } from "@/tracer/tracer";
import { safeParseStoryboard, lint, formatIssues } from "@/schema";

const read = () => new Promise<string>((res) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => res(s)); });

(async () => {
  const { code, meta, timeoutMs = 4000 } = JSON.parse(await read());
  const t = new Tracer();
  const logs: string[] = [];
  const ctx = vm.createContext({
    t, Math, JSON, Number, String, Array, Object, Map, Set, Boolean, Infinity, NaN, isNaN, parseInt, parseFloat,
    console: { log: (...a: unknown[]) => logs.push(a.map(String).join(" ")) },
  });
  try {
    new vm.Script(`(function(){"use strict";\n${code}\n})()`, { filename: "trace.js" })
      .runInContext(ctx, { timeout: timeoutMs });
  } catch (e: any) {
    console.log(JSON.stringify({ ok: false, stage: "execute", error: `${e?.name ?? "Error"}: ${e?.message ?? e}`, logs }));
    process.exit(0);
  }

  let sb: unknown;
  try { sb = t.build(meta); }
  catch (e: any) { console.log(JSON.stringify({ ok: false, stage: "build", error: String(e?.message ?? e), logs })); process.exit(0); }

  const parsed = safeParseStoryboard(sb);
  if (!parsed.success) {
    console.log(JSON.stringify({ ok: false, stage: "schema", error: JSON.stringify(parsed.error.issues.slice(0, 8), null, 2), logs }));
    process.exit(0);
  }
  const issues = lint(parsed.data);
  console.log(JSON.stringify({
    ok: !issues.some((i) => i.level === "error"),
    stage: "lint", storyboard: parsed.data, issues, report: formatIssues(issues), logs,
  }));
})();
