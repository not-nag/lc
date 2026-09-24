import { spawn } from "node:child_process";
import type { Storyboard, MetaInput } from "@/schema";
import type { LintIssue } from "@/schema/lint";

export type TraceResult = {
  ok: boolean; stage: string; storyboard?: Storyboard;
  issues?: LintIssue[]; report?: string; error?: string; logs?: string[];
};

/**
 * Run untrusted tracer code in a forked process with a wall-clock kill.
 * vm alone is not a security boundary; the child process is what bounds the damage.
 */
export function runTrace(code: string, meta: MetaInput, timeoutMs = 6000): Promise<TraceResult> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["tsx", "scripts/run-trace.ts"], { cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    const kill = setTimeout(() => { child.kill("SIGKILL"); resolve({ ok: false, stage: "timeout", error: `tracer exceeded ${timeoutMs}ms` }); }, timeoutMs + 6000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", () => {
      clearTimeout(kill);
      const line = out.trim().split("\n").filter((l) => l.startsWith("{")).pop();
      if (!line) return resolve({ ok: false, stage: "spawn", error: err.slice(-1500) || "no output from tracer" });
      try { resolve(JSON.parse(line)); }
      catch { resolve({ ok: false, stage: "parse", error: out.slice(-1500) }); }
    });
    child.stdin.write(JSON.stringify({ code, meta, timeoutMs }));
    child.stdin.end();
  });
}
