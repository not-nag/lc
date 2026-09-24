import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const slug = process.argv[2];
if (!slug) { console.error("usage: npm run render -- <slug>"); process.exit(1); }
mkdirSync("renders", { recursive: true });
const res = spawnSync("npx", ["remotion", "render", "src/remotion/index.ts",
  slug.replace(/[^A-Za-z0-9-]/g, "-"), `renders/${slug}.mp4`], { stdio: "inherit" });
if (res.status === 0) spawnSync("npx", ["tsx", "scripts/export-script.mts", slug], { stdio: "inherit" });
process.exit(res.status ?? 0);
