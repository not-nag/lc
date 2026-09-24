/**
 * lc100 generate — problem number (or slug) in, storyboard + video out.
 *   npm run generate -- 1
 *   npm run generate -- two-sum --no-render
 *   npm run generate -- 121 --notes "emphasise the running minimum"
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { loadEnv } from "@/lib/env";
import { fetchProblem } from "@/lib/leetcode";
import { patternFor } from "@/generator/pattern";
import { generateVideo } from "@/generator/generate";

loadEnv();

const argv = process.argv.slice(2);
const ref = argv[0];
if (!ref) { console.error("usage: npm run generate -- <number|slug> [--no-render] [--notes \"...\"] [--solution file.py]"); process.exit(1); }
const flag = (n: string) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : undefined; };
const has = (n: string) => argv.includes(n);

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Put it in .env.local or export it, then retry.");
  process.exit(1);
}

console.log(`→ fetching problem ${ref}`);
const p = await fetchProblem(/^\d+$/.test(ref) ? Number(ref) : ref);
const pattern = patternFor(p.topics);
console.log(`  #${p.number} ${p.title} · ${p.difficulty} · pattern=${pattern} · topics=${p.topics.join(", ")}`);

const solution = flag("--solution") ? (await import("node:fs")).readFileSync(flag("--solution")!, "utf8") : undefined;

console.log(`→ generating (model=${process.env.LC100_MODEL ?? "claude-opus-5"})`);
const r = await generateVideo({
  number: p.number, title: p.title, difficulty: p.difficulty, slug: p.slug,
  statement: p.statement, example: p.example, pattern, solution,
  notes: flag("--notes"),
});

for (const a of r.attempts)
  console.log(`  attempt: ${a.stage}${a.seconds ? ` (${a.seconds.toFixed(0)}s)` : ""}${a.error ? ` — ${a.error.split("\n")[0]}` : ""}`);

if (!existsSync("traces")) mkdirSync("traces");
writeFileSync(`traces/${p.slug}.generated.js`, r.code);

if (!r.ok || !r.storyboard) {
  console.error(`\n✗ generation failed after ${r.attempts.length} attempt(s).`);
  console.error(`  script saved to traces/${p.slug}.generated.js — fix it by hand and run: npm run traces`);
  if (r.attempts.at(-1)?.report) console.error("\n" + r.attempts.at(-1)!.report);
  process.exit(1);
}

const out = `storyboards/${p.slug}.json`;
if (!existsSync("storyboards")) mkdirSync("storyboards");
writeFileSync(out, JSON.stringify(r.storyboard, null, 2));
const warns = (r.issues ?? []).filter((i) => i.level === "warn");
console.log(`✓ ${out}  (${r.storyboard.scenes.length} scenes)`);
if (warns.length) console.log(warns.map((w) => `  [warn] ${w.where}: ${w.message}`).join("\n"));

spawnSync("node", ["scripts/index-storyboards.mjs"], { stdio: "inherit" });

if (!has("--no-render")) {
  mkdirSync("renders", { recursive: true });
  console.log(`→ rendering renders/${p.slug}.mp4`);
  const id = p.slug.replace(/[^A-Za-z0-9-]/g, "-");
  const res = spawnSync("npx", ["remotion", "render", "src/remotion/index.ts", id, `renders/${p.slug}.mp4`], { stdio: "inherit" });
  process.exit(res.status ?? 0);
} else {
  console.log(`→ preview:  npm run studio     render:  npx remotion render src/remotion/index.ts ${p.slug} renders/${p.slug}.mp4`);
}
