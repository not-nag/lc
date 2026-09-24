import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Storyboard } from "@/schema";

/**
 * The house style lives in HOUSE-STYLE.md so that humans, this repo's CLAUDE.md, and the
 * model all read the same text. Edit the markdown, never a copy of it.
 */
const styleGuide = () => {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const p of [resolve(process.cwd(), "HOUSE-STYLE.md"), resolve(here, "../../HOUSE-STYLE.md")]) {
    if (existsSync(p)) return readFileSync(p, "utf8").replace(/^# House style[\s\S]*?^---\n/m, "").trim();
  }
  throw new Error("HOUSE-STYLE.md not found — it is the source of truth for the prompt");
};

export const SYSTEM = `${styleGuide()}

Return ONLY the JavaScript function body. No markdown fences, no explanation, no imports.`;

export function userPrompt(input: {
  number?: number; title: string; difficulty: string; statement: string;
  solution?: string; language?: string; example?: string; notes?: string;
}) {
  return [
    `Problem${input.number ? ` #${input.number}` : ""}: ${input.title} (${input.difficulty})`,
    ``, `STATEMENT`, input.statement.trim(),
    input.example ? `\nEXAMPLE\n${input.example.trim()}` : "",
    input.solution ? `\nREFERENCE SOLUTION (${input.language ?? "python"})\n${input.solution.trim()}` : "",
    input.notes ? `\nEXTRA DIRECTION\n${input.notes.trim()}` : "",
    ``, `Write the tracer script for this problem.`,
  ].filter(Boolean).join("\n");
}

export function repairPrompt(code: string, report: string, stage: string) {
  return `Your previous script failed at the "${stage}" stage.

PROBLEMS
${report}

YOUR PREVIOUS SCRIPT
${code}

Fix every problem listed. Return ONLY the corrected JavaScript function body.`;
}

export function pacingPrompt(sb: Storyboard, seconds: number, target: number) {
  return `The script is valid but runs ${seconds.toFixed(0)}s; the target is under ${target}s.
Shorten it: cut beats from explanatory steps, merge adjacent beats that change little, and
shorten captions. Do not remove the walkthrough. Return ONLY the corrected function body.`;
}
