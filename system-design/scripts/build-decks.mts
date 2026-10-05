/** Compile traces/*.ts into validated decks/*.json. */
import { readdirSync, writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Tracer } from "@/tracer/tracer";
import { safeParseDeck, flatten } from "@/schema/deck";
import { lint, formatIssues, hasErrors } from "@/schema/lint";

const only = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : undefined;
const force = process.argv.includes("--force");
if (!existsSync("decks")) mkdirSync("decks");
if (!existsSync("traces")) mkdirSync("traces");

const files = readdirSync("traces").filter((f) => f.endsWith(".ts") && (!only || f.includes(only)));
let failed = 0;

for (const f of files) {
  const mod = await import(pathToFileURL(join(process.cwd(), "traces", f)).href);
  const t = new Tracer();
  try { mod.trace(t); }
  catch (e: any) { console.error(`✗ ${f} threw: ${e?.message}`); failed++; continue; }

  const parsed = safeParseDeck(t.build(mod.meta));
  if (!parsed.success) {
    console.error(`✗ ${f} schema:\n${JSON.stringify(parsed.error.issues.slice(0, 5), null, 2)}`);
    failed++; continue;
  }
  const deck = parsed.data;
  const issues = lint(deck);
  if (hasErrors(issues)) { console.error(`✗ ${deck.meta.slug}\n${formatIssues(issues.filter((i) => i.level === "error"))}`); failed++; continue; }

  const out = join("decks", `${deck.meta.slug}.json`);
  if (!force && existsSync(out)) {
    try {
      if (JSON.parse(readFileSync(out, "utf8")).edited) {
        console.log(`• ${deck.meta.slug} skipped — edited in the browser. Use --force to regenerate and lose those edits.`);
        continue;
      }
    } catch { /* unreadable, fall through and rewrite */ }
  }
  writeFileSync(out, JSON.stringify(deck, null, 2));
  console.log(`✓ ${deck.meta.slug}  ${flatten(deck).length} slides  ${deck.sections.length} sections`);
  const warns = issues.filter((i) => i.level === "warn");
  if (warns.length) console.log(formatIssues(warns).split("\n").map((l) => "  " + l).join("\n"));
}
if (failed) { console.error(`\n${failed} trace(s) failed`); process.exit(1); }
