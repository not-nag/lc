import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM, userPrompt, repairPrompt, pacingPrompt } from "./prompt";
import { runTrace } from "@/tracer/run";
import { fewShots } from "./examples";
import type { Storyboard, MetaInput } from "@/schema";
import type { LintIssue } from "@/schema/lint";

export type ProblemInput = {
  number?: number; title: string; difficulty: "Easy" | "Medium" | "Hard";
  statement: string; solution?: string; language?: string; example?: string;
  notes?: string; pattern?: string; slug?: string;
};

export type GenerateResult = {
  ok: boolean;
  storyboard?: Storyboard;
  code: string;
  attempts: { stage: string; error?: string; report?: string; seconds?: number }[];
  issues?: LintIssue[];
};

const MODEL = process.env.LC100_MODEL ?? "claude-opus-5";
const MAX_SECONDS = 100;
const TARGET_SECONDS = 92;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const strip = (s: string) => s.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();

/**
 * Generate → execute → validate → repair. The model never sees a video; it sees
 * lint errors, which are cheap and specific enough to fix in one or two rounds.
 */
export async function generateVideo(input: ProblemInput, opts: { maxRepairs?: number; apiKey?: string } = {}): Promise<GenerateResult> {
  const client = new Anthropic({ apiKey: opts.apiKey ?? process.env.ANTHROPIC_API_KEY });
  const maxRepairs = opts.maxRepairs ?? 2;
  const slug = input.slug ?? slugify(input.title);
  const meta: MetaInput = {
    slug, number: input.number, title: input.title, difficulty: input.difficulty,
    pattern: input.pattern, fps: 30, width: 1080, height: 1920, framesPerBeat: 10,
  };

  const messages: Anthropic.MessageParam[] = [
    ...fewShots(input.pattern),
    { role: "user", content: userPrompt(input) },
  ];

  const attempts: GenerateResult["attempts"] = [];
  let code = "";

  for (let round = 0; round <= maxRepairs; round++) {
    const res = await client.messages.create({
      model: MODEL, max_tokens: 8000, system: SYSTEM, messages,
    });
    code = strip(res.content.filter((c) => c.type === "text").map((c) => (c as any).text).join(""));

    const trace = await runTrace(code, meta);

    if (!trace.ok) {
      attempts.push({ stage: trace.stage, error: trace.error, report: trace.report });
      if (round === maxRepairs) return { ok: false, code, attempts, issues: trace.issues };
      messages.push({ role: "assistant", content: code });
      messages.push({ role: "user", content: repairPrompt(code, trace.report ?? trace.error ?? "unknown failure", trace.stage) });
      continue;
    }

    const sb = trace.storyboard!;
    const seconds = secondsOf(sb);
    attempts.push({ stage: "ok", seconds, report: trace.report });

    if (seconds > MAX_SECONDS && round < maxRepairs) {
      messages.push({ role: "assistant", content: code });
      messages.push({ role: "user", content: pacingPrompt(sb, seconds, TARGET_SECONDS) });
      continue;
    }
    return { ok: true, storyboard: sb, code, attempts, issues: trace.issues };
  }
  return { ok: false, code, attempts };
}

function secondsOf(sb: Storyboard) {
  // mirrors engine/compile without importing React-adjacent code
  const CPS = 19;
  let frames = 0;
  for (const sc of sb.scenes) {
    for (const st of sc.steps) {
      const want = Math.max(1, Math.round(st.beats * sb.meta.framesPerBeat));
      const floor = st.label
        ? Math.round(Math.min(2.4, Math.max(0.7, st.label.length / CPS + 0.25)) * sb.meta.fps) : 0;
      const speech = st.voice?.trim()
        ? Math.round(Math.min(8.5, st.voice.trim().split(/\s+/).length / 2.95 + 0.22) * sb.meta.fps) : 0;
      frames += Math.max(want, Math.max(floor, speech));
    }
    frames += 5;
  }
  return frames / sb.meta.fps;
}
