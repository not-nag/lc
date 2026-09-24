import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "group-anagrams", number: 49, title: "Group Anagrams", difficulty: "Medium",
  pattern: "hash-key", tagline: "same letters, same shelf",
};

const SRC = `groups = defaultdict(list)

for word in strs:
    key = "".join(sorted(word))
    groups[key].append(word)

return list(groups.values())`;

export function trace(t: Tracer) {
  const WORDS = ["eat", "tea", "tan", "ate", "bat"];

  t.section("hook");
  t.say("Group Anagrams, in one pass.");
  t.slide("Put the anagrams together");

  const pw = t.array("pw", WORDS, { label: "strs" });
  t.section("problem", { show: ["pw"] });
  t.say("Group the words that are made of the same letters.");
  t.slide("group words with the same letters");
  t.say("Comparing every word against every other would be quadratic. We want one pass.");
  t.slide("comparing every pair is O(n²)");

  /* ── walkthrough ────────────────────────────────────── */
  const a = t.array("a", WORDS, { label: "strs" });
  const g = t.map("g", { label: "sorted letters  →  group" });
  t.section("walkthrough", { show: ["a", "g"] });

  t.say("Anagrams look different, but sorting their letters makes them identical. That sorted form is the shelf they belong on.");
  t.slide("sort the letters  →  a shared key");

  const groups = new Map<string, string[]>();
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    const key = [...w].sort().join("");

    a.clear();
    a.tagClear();
    a.highlight([i], "active");
    a.tag(i, `sorts to "${key}"`);
    t.say(`"${w}" sorted is "${key}".`);
    t.slide(`"${w}"  →  "${key}"`);

    const existing = groups.get(key);
    if (existing) {
      existing.push(w);
      g.put(key, existing.join(", "));
      g.highlight(key, "match");
      t.say(`That shelf already exists, so "${w}" joins it.`);
      t.slide(`"${key}" exists  →  add "${w}"`);
    } else {
      groups.set(key, [w]);
      g.put(key, w);
      t.say(`No shelf for "${key}" yet, so start one.`);
      t.slide(`new shelf "${key}"`);
    }

    if (i === 1) {
      t.callout("The sorted word is the group's name", "insight");
      t.say("That is the whole trick. Two words are anagrams exactly when their sorted letters match, so the sorted form can name the group.");
      t.slide("anagrams share one sorted form");
    }
  }

  a.clear(); a.tagClear();
  t.say("Three shelves, and every word is on the right one.");
  t.result([...groups.values()].map((x) => x.join("/")));
  t.slide();

  /* ── code ───────────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(4);
  t.say("Sort the letters to get the key.");
  t.slide();
  t.line(5);
  t.say("Drop the word on that shelf.");
  t.slide();

  t.text("otext", "Intuition", [
    "Anagrams are the same word",
    "once you sort the letters.",
    "So sort it, and use that as the name.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Anagrams are the same word once you sort the letters, so sort it and use that as the name.");
  t.slide();
}
