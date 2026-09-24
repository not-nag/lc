import { NextResponse } from "next/server";
import { writeFileSync, existsSync } from "node:fs";
import { safeParseDeck } from "@/schema";

export const runtime = "nodejs";

/** Saves an edited deck back to disk. Authoring tool — no auth, dev only. */
export async function POST(req: Request) {
  const { slug, deck } = await req.json();
  if (!/^[a-z0-9-]+$/.test(String(slug ?? ""))) return NextResponse.json({ ok: false, error: "bad slug" }, { status: 400 });
  if (!existsSync(`decks/${slug}.json`)) return NextResponse.json({ ok: false, error: "no such deck" }, { status: 404 });

  const p = safeParseDeck(deck);
  if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues.slice(0, 4) }, { status: 400 });

  // mark it yours, so `npm run decks` won't regenerate over your wording
  writeFileSync(`decks/${slug}.json`, JSON.stringify({ ...p.data, edited: true }, null, 2));
  return NextResponse.json({ ok: true });
}
