import { readFileSync, readdirSync, existsSync } from "node:fs";
import { safeParseDeck, type Deck } from "@/schema";

const DIR = "decks";

export function listDecks(): Deck[] {
  if (!existsSync(DIR)) return [];
  const out: Deck[] = [];
  for (const f of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
    const p = safeParseDeck(JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")));
    if (p.success) out.push(p.data);
    else console.error(`[decks] ${f}:`, p.error.issues.slice(0, 4));
  }
  return out.sort((a, b) => (a.meta.number ?? 0) - (b.meta.number ?? 0));
}

export function loadDeck(slug: string): Deck | null {
  const f = `${DIR}/${slug}.json`;
  if (!existsSync(f)) return null;
  const p = safeParseDeck(JSON.parse(readFileSync(f, "utf8")));
  return p.success ? p.data : null;
}
