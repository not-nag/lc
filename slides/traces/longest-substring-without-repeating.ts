import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "longest-substring-without-repeating", number: 3,
  title: "Longest Substring Without Repeating Characters", difficulty: "Medium",
  pattern: "sliding-window", tagline: "a window that never looks back",
};

const SRC = `last = {}
left = best = 0

for right, ch in enumerate(s):
    if ch in last and last[ch] >= left:
        left = last[ch] + 1
    last[ch] = right
    best = max(best, right - left + 1)`;

export function trace(t: Tracer) {
  const S = "abcabcbb";

  t.section("hook");
  t.say("Longest Substring Without Repeating Characters.");
  t.slide("The longest run of unique letters");

  const ps = t.string("ps", S, { label: "s" });
  t.section("problem", { show: ["ps"] });
  t.say("Find the longest stretch with no letter repeated.");
  t.slide("longest stretch, no repeats");
  t.say("Checking every substring is cubic. But both ends of the answer only ever move forward.");
  t.slide("every substring is far too slow");

  const a = t.string("a", S, { label: "s" });
  const m = t.map("m", { label: "letter  →  last seen at" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["a", ["m", "v"]] });

  let left = 0, best = 0;
  a.pointer("L", 0, "danger");
  a.pointer("R", 0, "success");
  v.setAll({ left: 0, best: 0 });
  t.say("Two edges, and a note of where each letter was last seen.");
  t.slide("left = 0 · best = 0");

  const last = new Map<string, number>();
  for (let right = 0; right < 6; right++) {
    const ch = S[right];
    a.clear();
    a.move("R", right);
    a.highlight([right], "active");
    t.say(`Right edge reaches '${ch}'.`);
    t.slide(`right = ${right}  ·  '${ch}'`);

    const seenAt = last.get(ch);
    if (seenAt !== undefined && seenAt >= left) {
      left = seenAt + 1;
      a.move("L", left);
      m.highlight(ch, "bad");
      t.say(`'${ch}' is already inside the window, last seen at ${seenAt}. Jump the left edge past it.`);
      t.slide(`'${ch}' repeats  →  left = ${left}`);

      if (right === 3) {
        t.callout("The left edge never moves backwards", "insight");
        t.aside("Each letter is visited twice at most.");
        t.say("The left edge only ever jumps forward, never back. So each character is touched at most twice, and the whole thing is linear.");
        t.slide("both edges only move right");
      }
    } else {
      t.say(`'${ch}' is not in the window.`);
      t.slide(`'${ch}' is new here`);
    }

    last.set(ch, right);
    m.put(ch, right);
    const len = right - left + 1;
    best = Math.max(best, len);
    a.window(left, right, `length ${len}`);
    v.setAll({ left, best });
    t.say(`The window is ${len} long, and the best so far is ${best}.`);
    t.slide(`window = ${len}  ·  best = ${best}`);
  }

  a.clear(); a.windowClear(); a.drop("L"); a.drop("R");
  a.highlight([0, 1, 2], "match");
  t.say("Three is the longest run of unique letters.");
  t.result(best);
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(5, 6);
  t.say("A repeat inside the window pushes the left edge past it.");
  t.slide();
  t.line(7, 8);
  t.say("Record where this letter was seen, and measure the window.");
  t.slide();

  t.text("otext", "Intuition", [
    "If both edges only move right,",
    "you never re-check anything.",
    "That is a sliding window.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("If both edges only move right, you never re-check anything. That is a sliding window.");
  t.slide();
}
