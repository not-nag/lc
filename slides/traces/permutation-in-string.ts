import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "permutation-in-string", number: 567,
  title: "Permutation In String", difficulty: "Medium",
  pattern: "sliding-window", tagline: "a window that never changes size",
};

const SRC = `need = Counter(s1)
window = Counter(s2[:len(s1)])

if window == need: return True
for i in range(len(s1), len(s2)):
    window[s2[i]] += 1
    window[s2[i - len(s1)]] -= 1
    if window == need: return True`;

export function trace(t: Tracer) {
  const S1 = "ab", S2 = "eidbaooo";

  t.section("hook");
  t.say("Permutation In String.");
  t.slide("Does a scramble of s1 sit inside s2?");

  const p1 = t.string("p1", S1, { label: "s1" });
  const p2 = t.string("p2", S2, { label: "s2" });
  t.section("problem", { show: ["p1", "p2"] });
  t.say("Does any rearrangement of the first string appear inside the second?");
  t.slide("is a permutation of s1 inside s2?");
  t.say("A permutation has the same length and the same letter counts. Both are fixed.");
  t.slide("same length, same letter counts");

  const b = t.string("b", S2, { label: "s2" });
  const w = t.map("w", { label: "window counts" });
  t.section("walkthrough", { show: ["b", "w"] });

  t.callout("The window size never changes", "insight");
  t.aside("Slide it, don't grow it.");
  t.say("Because a permutation is exactly two letters long, the window is always exactly two wide. It slides along without ever changing size.");
  t.slide(`window is always ${S1.length} wide`);

  const need = new Map<string, number>();
  for (const ch of S1) need.set(ch, (need.get(ch) ?? 0) + 1);

  let found = false;
  for (let i = 0; i + S1.length <= 5; i++) {
    const seg = S2.slice(i, i + S1.length);
    const cnt = new Map<string, number>();
    for (const ch of seg) cnt.set(ch, (cnt.get(ch) ?? 0) + 1);

    b.clear();
    for (let k = i; k < i + S1.length; k++) b.highlight([k], "compare");
    b.window(i, i + S1.length - 1, `"${seg}"`);
    w.clear();
    for (const [ch, n] of cnt) w.put(ch, n);
    t.say(`The window holds "${seg}".`);
    t.slide(`window = "${seg}"`);

    const match = [...need].every(([ch, n]) => cnt.get(ch) === n) && cnt.size === need.size;
    if (match) {
      found = true;
      for (let k = i; k < i + S1.length; k++) b.highlight([k], "match");
      t.say(`Same letters, same counts. That is a permutation of "${S1}".`);
      t.slide(`counts match  →  found`);
      break;
    }
    t.say(`Not the right letters. Slide one step: one letter in, one letter out.`);
    t.slide(`no match  →  slide right`);
  }

  b.clear(); b.windowClear();
  b.highlight([3, 4], "match");
  t.say(`"ba" is a scramble of "ab", so the answer is yes.`);
  t.result(found);
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1, 2);
  t.say("The counts we need, and the counts in the first window.");
  t.slide();
  t.line(6, 7);
  t.say("Sliding is one letter in and one letter out — constant work per step.");
  t.slide();

  t.text("otext", "Intuition", [
    "A permutation has a fixed length.",
    "So the window never resizes —",
    "one in, one out, and compare.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("A permutation has a fixed length, so the window never resizes. One letter in, one out, and compare.");
  t.slide();
}
