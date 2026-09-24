import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

export const runtime = "nodejs";
export const maxDuration = 600;

/** Kicks off a local render. Long renders should be watched in the terminal. */
export async function POST(req: Request) {
  const { slug } = await req.json();
  if (!/^[a-z0-9-]+$/.test(String(slug ?? "")))
    return NextResponse.json({ ok: false, error: "bad slug" }, { status: 400 });

  mkdirSync("renders", { recursive: true });
  const child = spawn("npx", ["remotion", "render", "src/remotion/index.ts", slug, `renders/${slug}.mp4`],
    { detached: true, stdio: "ignore" });
  child.unref();
  return NextResponse.json({ ok: true, out: `renders/${slug}.mp4`, note: "rendering in the background" });
}
