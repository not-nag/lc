import { existsSync, statSync } from "node:fs";

export type RenderInfo = { exists: boolean; mb?: number; mtime?: string; hasScript: boolean };

/** What has actually been rendered to disk for a slug. */
export function renderInfo(slug: string): RenderInfo {
  const mp4 = `renders/${slug}.mp4`;
  if (!existsSync(mp4)) return { exists: false, hasScript: existsSync(`renders/${slug}.steps.txt`) };
  const st = statSync(mp4);
  return {
    exists: true,
    mb: st.size / 1e6,
    mtime: st.mtime.toISOString().slice(0, 16).replace("T", " "),
    hasScript: existsSync(`renders/${slug}.steps.txt`),
  };
}
