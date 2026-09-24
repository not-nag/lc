import { NextResponse } from "next/server";
import { writeFileSync } from "node:fs";
import { validate } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { slug, storyboard } = await req.json();
  if (!/^[a-z0-9-]+$/.test(String(slug ?? "")))
    return NextResponse.json({ ok: false, error: "bad slug" }, { status: 400 });

  const v = validate(storyboard);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.report }, { status: 400 });

  writeFileSync(`storyboards/${slug}.json`, JSON.stringify(v.storyboard, null, 2));
  return NextResponse.json({ ok: true, stats: v.stats });
}
