import { readFileSync, existsSync, readdirSync } from "node:fs";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Approved traces double as few-shot examples. Quality compounds: once a pattern
 * has a human-tuned example, every later problem of that pattern inherits it.
 */
const EX_DIR = "traces";

function body(file: string) {
  const src = readFileSync(file, "utf8");
  const i = src.indexOf("export function trace(t: Tracer) {");
  if (i === -1) return null;
  const inner = src.slice(src.indexOf("{", i) + 1, src.lastIndexOf("}")).trim();
  // strip TS-only syntax so the example matches what the model must emit
  return inner.replace(/ as (number|string|boolean|any)\b/g, "");
}

function patternOf(file: string) {
  const m = readFileSync(file, "utf8").match(/pattern:\s*"([^"]+)"/);
  return m?.[1];
}

export function fewShots(pattern?: string, limit = 2): Anthropic.MessageParam[] {
  if (!existsSync(EX_DIR)) return [];
  const files = readdirSync(EX_DIR).filter((f) => f.endsWith(".ts")).map((f) => `${EX_DIR}/${f}`);
  const ranked = files.sort((a, b) => Number(patternOf(b) === pattern) - Number(patternOf(a) === pattern));
  const out: Anthropic.MessageParam[] = [];
  for (const f of ranked.slice(0, limit)) {
    const b = body(f);
    const title = readFileSync(f, "utf8").match(/title:\s*"([^"]+)"/)?.[1];
    if (!b || !title) continue;
    out.push({ role: "user", content: `Write the tracer script for: ${title}.` });
    out.push({ role: "assistant", content: b });
  }
  return out;
}
