/**
 * Per storyboard:
 *   <slug>.vo.txt     the narration, with timestamps — record against this
 *   <slug>.post.txt   the social caption
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { parseStoryboard } from "@/schema/storyboard";
import { compile } from "@/engine/compile";

const only = process.argv[2];
const files = readdirSync("storyboards").filter((f) => f.endsWith(".json") && (!only || f.startsWith(only)));
if (!files.length) { console.error(`no storyboard matching "${only ?? ""}"`); process.exit(1); }
mkdirSync("renders", { recursive: true });

const stamp = (frames: number, fps: number, comma = true) => {
  const total = frames / fps;
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60), ms = Math.round((total % 1) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return comma ? `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}` : `${pad(m)}:${pad(s)}`;
};

for (const f of files) {
  const sb = parseStoryboard(JSON.parse(readFileSync(`storyboards/${f}`, "utf8")));
  const tl = compile(sb);
  const vo: string[] = [`${sb.meta.title}  —  ${tl.seconds.toFixed(0)}s`, "=".repeat(54), ""];
  let n = 0, spoken = 0;

  tl.scenes.forEach((slot) => {
    const scene = sb.scenes[slot.index];
    const lines: string[] = [];
    slot.steps.forEach((st) => {
      const step = scene.steps[st.index];
      const at = stamp(slot.from + st.from, tl.fps, false);
      if (step.voice) { lines.push(`  ${at}   ${step.voice}`); spoken += step.voice.split(/\s+/).length; }
      if (step.label?.trim()) n++;
    });
    if (lines.length) { vo.push(`[${scene.kind}]`, ...lines, ""); }
  });

  const base = `renders/${sb.meta.slug}`;
  writeFileSync(`${base}.vo.txt`, vo.join("\n") + "\n");

  const tag = sb.meta.tagline?.trim();
  writeFileSync(`${base}.post.txt`,
    `#LeetcodeUnder100Seconds\n${sb.meta.number}. ${sb.meta.title}${tag ? ` - ${tag}` : ""}\n\n#DSA #Leetcode\n`);

  const wpm = spoken / (tl.seconds / 60);
  console.log(`✓ ${sb.meta.slug}  ${tl.seconds.toFixed(0)}s · ${n} labels · ${spoken} spoken words (${wpm.toFixed(0)} wpm)`);
  if (spoken === 0) console.log(`  [warn] no t.say() narration — ${base}.vo.txt is empty`);
  else if (wpm > 175) console.log(`  [warn] ${wpm.toFixed(0)} wpm is fast to read aloud — add beats or trim words`);
}
