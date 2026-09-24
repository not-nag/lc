/**
 * Pull stills out of any video so they can actually be looked at.
 * Claude cannot watch video; it can look at images. This bridges that.
 *
 *   npm run frames -- ~/Desktop/my-video.mp4          # 9 evenly spaced stills
 *   npm run frames -- video.mp4 --n 16 --out ./look   # more, elsewhere
 *   npm run frames -- video.mp4 --at 3,12,40          # specific seconds
 */
import { mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, extname } from "node:path";
import { ffmpegPaths } from "@/lib/ffmpeg";

const src = process.argv[2];
if (!src) { console.error("usage: npm run frames -- <video> [--n 9] [--at 3,12,40] [--out dir]"); process.exit(1); }
if (!existsSync(src)) { console.error(`no file at ${src}`); process.exit(1); }
const flag = (n: string, d?: string) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };

const { ffmpeg, ffprobe, env } = ffmpegPaths();
const dur = Number(spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src],
  { encoding: "utf8", env }).stdout.trim());
if (!Number.isFinite(dur)) { console.error("could not read duration"); process.exit(1); }

const name = basename(src, extname(src));
const out = flag("--out", `frames/${name}`)!;
mkdirSync(out, { recursive: true });

const at = flag("--at");
const n = Math.max(1, Number(flag("--n", "9")));
const times = at
  ? at.split(",").map(Number).filter((x) => Number.isFinite(x) && x >= 0 && x < dur)
  : Array.from({ length: n }, (_, i) => ((i + 0.5) / n) * dur);

console.log(`${name}: ${dur.toFixed(1)}s → ${times.length} stills in ${out}/`);
times.forEach((sec, i) => {
  const file = `${out}/${String(i + 1).padStart(2, "0")}_${sec.toFixed(1)}s.png`;
  const r = spawnSync(ffmpeg, ["-y", "-ss", String(sec), "-i", src, "-frames:v", "1",
    "-vf", "scale=620:-1", file], { encoding: "utf8", env });
  console.log(r.status === 0 ? `  ${file}` : `  FAILED at ${sec}s: ${(r.stderr || "").slice(-120)}`);
});
