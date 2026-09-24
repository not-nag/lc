import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "longest-repeating-character-replacement", number: 424,
  title: "Longest Repeating Character Replacement", difficulty: "Medium",
  pattern: "sliding-window", tagline: "k letters you're allowed to lie about",
};

const SRC = `count = {}
left = best = 0

for right, ch in enumerate(s):
    count[ch] = count.get(ch, 0) + 1
    while (right - left + 1) - max(count.values()) > k:
        count[s[left]] -= 1
        left += 1
    best = max(best, right - left + 1)`;

export function trace(t: Tracer) {
  const S = "AABABBA";
  const K = 1;

  t.section("hook");
  t.say("Longest Repeating Character Replacement, with one swap allowed.");
  t.slide("Longest run, with k swaps");

  const ps = t.string("ps", S, { label: "s · k = 1" });
  t.section("problem", { show: ["ps"] });
  t.say("You may change up to k letters. How long can you make a run of one letter?");
  t.slide("change k letters — longest single-letter run?");
  t.say("So a window is allowed as long as the letters that are not the majority fit inside k.");
  t.slide("a window works if the odd ones out ≤ k");

  const a = t.string("a", S, { label: "s · k = 1" });
  const c = t.map("c", { label: "letters in the window" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["a", ["c", "v"]] });

  t.callout("Count what you'd have to change, not what matches", "insight");
  t.say("The cost of a window is its length minus however many of its most common letter it holds. If that cost is over k, the window is illegal.");
  t.slide("cost = length − most common letter");

  let left = 0, best = 0;
  const count = new Map<string, number>();
  const bump = (ch: string, d: number) => {
    count.set(ch, (count.get(ch) ?? 0) + d);
    c.put(ch, count.get(ch)!);
  };

  for (let right = 0; right < 5; right++) {
    const ch = S[right];
    bump(ch, 1);
    a.clear();
    a.highlight([right], "active");
    t.say(`Right edge takes in '${ch}'.`);
    t.slide(`add '${ch}'`);

    let cost = (right - left + 1) - Math.max(...count.values());
    a.window(left, right, `cost ${cost}`);
    v.setAll({ cost, k: K });
    t.say(`The window is ${right - left + 1} long and holds ${Math.max(...count.values())} of its commonest letter, so ${cost} would need changing.`);
    t.slide(`${right - left + 1} − ${Math.max(...count.values())} = ${cost}`);

    while (cost > K) {
      bump(S[left], -1);
      left++;
      cost = (right - left + 1) - Math.max(...count.values());
      a.clear();
      a.highlight([right], "active");
      a.window(left, right, `cost ${cost}`);
      v.setAll({ cost, left });
      t.say(`${cost + 1} is more than ${K}, so drop the leftmost letter and try again.`);
      t.slide(`cost > ${K}  →  left = ${left}`);
    }

    const len = right - left + 1;
    if (len > best) { best = len; v.set("best", best); t.slide(`window ${len}  →  best = ${best}`); }
    else t.slide(`window ${len}  ≤  ${best}`);
  }

  a.clear(); a.windowClear();
  a.highlight([0, 1, 2, 3], "match");
  t.say("Four in a row, changing just one letter.");
  t.result(best);
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(5);
  t.say("Take in the new letter.");
  t.slide();
  t.line(6, 7, 8);
  t.say("While the window costs too much, shrink it from the left.");
  t.slide();

  t.text("otext", "Intuition", [
    "A window is legal while",
    "the letters you'd have to change",
    "still fit inside k.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("A window is legal while the letters you would have to change still fit inside k.");
  t.slide();
}
