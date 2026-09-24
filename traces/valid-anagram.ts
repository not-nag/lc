import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "valid-anagram", number: 242, title: "Valid Anagram", difficulty: "Easy",
  pattern: "hash-count", tagline: "same letters, different order",
};

const SRC = `count = {}

for ch in s:
    count[ch] = count.get(ch, 0) + 1
for ch in t:
    count[ch] = count.get(ch, 0) - 1

return all(v == 0 for v in count.values())`;

export function trace(t: Tracer) {
  const S = "cat", T = "act";

  t.section("hook");
  t.say("Valid Anagram, in one pass each way.");
  t.slide("Same letters, different order");

  const ps = t.string("ps", S, { label: "s" });
  const pt = t.string("pt", T, { label: "t" });
  t.section("problem", { show: ["ps", "pt"] });
  t.say("Two words. Are they made of exactly the same letters?");
  t.slide("are these anagrams?");
  t.say("Sorting both would work, but that costs n log n. We can do better.");
  t.slide("sorting works — but costs n log n");

  /* ── walkthrough: one counter, up then down ─────────── */
  const a = t.string("a", S, { label: "s" });
  const b = t.string("b", T, { label: "t" });
  const c = t.map("c", { label: "letter counts" });
  t.section("walkthrough", { show: [["a", "b"], "c"] });

  t.say("Keep one tally. Every letter in the first word pushes its count up.");
  t.slide("count = {}");

  for (let i = 0; i < S.length; i++) {
    const ch = S[i];
    a.clear();
    a.highlight([i], "active");
    const prev = (c.peek(ch) as number) ?? 0;
    c.put(ch, prev + 1);
    t.say(`${ch} in the first word, so its count goes up.`);
    t.slide(`${ch}  →  ${prev + 1}`);
  }

  a.clear();
  t.say("Now the second word pulls every count back down.");
  t.slide("now subtract the second word");

  let ok = true;
  for (let i = 0; i < T.length; i++) {
    const ch = T[i];
    b.clear();
    b.highlight([i], "active");
    const prev = (c.peek(ch) as number) ?? 0;
    c.put(ch, prev - 1);
    if (prev - 1 < 0) ok = false;
    t.say(`${ch} in the second word, so its count comes back down.`);
    t.slide(`${ch}  →  ${prev - 1}`);
  }

  b.clear();
  t.callout("Every count back to zero means the same letters", "insight");
  t.say("Every tally is back to zero. The words used exactly the same letters.");
  t.slide("all zero  →  anagram");
  t.result(ok, "Anagram");
  t.slide();

  /* ── code ───────────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1);
  t.say("One tally for every letter.");
  t.slide();
  t.line(3, 4);
  t.say("The first word counts up.");
  t.slide();
  t.line(5, 6);
  t.say("The second counts down.");
  t.slide();
  t.line(8);
  t.say("If nothing is left over, they match.");
  t.slide();

  t.text("otext", "Intuition", [
    "Count the letters going in.",
    "Take the same letters out.",
    "Anything left over means they differ.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Count them in, take them out, and see if anything is left.");
  t.slide();
}
