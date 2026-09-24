import { createRequire } from "node:module";

/** Remotion ships ffmpeg/ffprobe binaries — no system install needed. */
export function ffmpegPaths() {
  const req = createRequire(import.meta.url);
  for (const pkg of [
    "@remotion/compositor-darwin-arm64", "@remotion/compositor-darwin-x64",
    "@remotion/compositor-linux-x64-gnu", "@remotion/compositor-win32-x64-msvc",
  ]) {
    try {
      const dir = req.resolve(`${pkg}/package.json`).replace(/\/package\.json$/, "");
      // the binaries link against dylibs sitting beside them, so the loader needs the dir
      const env = {
        ...process.env,
        DYLD_LIBRARY_PATH: [dir, process.env.DYLD_LIBRARY_PATH].filter(Boolean).join(":"),
        LD_LIBRARY_PATH: [dir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":"),
      };
      return { ffmpeg: `${dir}/ffmpeg`, ffprobe: `${dir}/ffprobe`, env };
    } catch { /* wrong platform, try the next */ }
  }
  throw new Error("no bundled ffmpeg found — install ffmpeg and put it on PATH");
}
