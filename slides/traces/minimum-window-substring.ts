import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "minimum-window-substring", number: 76,
  title: "Minimum Window Substring", difficulty: "Hard",
  pattern: "sliding-window", tagline: "grow until it works, then squeeze",
};

const SRC = `need = Counter(t)
have, missing = {}, len(need)
left, best = 0, None

for right, ch in enumerate(s):
    have[ch] = have.get(ch, 0) + 1
    if have[ch] == need.get(ch): missing -= 1

    while missing == 0:
        if best is None or right - left < len(best):
            best = s[left : right + 1]
        have[s[left]] -= 1
        if have[s[left]] < need.get(s[left], 0): missing += 1
        left += 1`;

export function trace(t: Tracer) {
  const S = "ADOBECODEBANC", T = "ABC";

  t.section("hook");
  t.say("Minimum Window Substring.");
  t.slide("The shortest stretch containing them all");

  const ps = t.string("ps", S, { label: "s" });
  const pt = t.string("pt", T, { label: "t" });
  t.section("problem", { show: ["ps", "pt"] });
  t.say("Find the shortest piece of the first string that contains every letter of the second.");
  t.slide("shortest window holding all of t");
  t.say("Checking every substring is far too slow. Instead, grow a window until it works, then squeeze it.");
  t.slide("grow until valid, then squeeze");

  const a = t.string("a", S, { label: "s" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["a", "v"] });

  t.callout("Two moves: grow right, squeeze left", "insight");
  t.aside("Both edges only ever move right.");
  t.say("The right edge grows until the window is valid. Then the left edge squeezes in while it stays valid. Neither ever goes backwards.");
  t.slide("right grows · left squeezes");

  /* the three moments that matter */
  a.window(0, 5, "ADOBEC");
  for (let i = 0; i <= 5; i++) a.highlight([i], "window");
  a.highlight([0], "match"); a.highlight([3], "match"); a.highlight([5], "match");
  v.setAll({ window: 6, best: "—" });
  t.say("The right edge grows until A, B and C are all inside. Six letters — the first thing that works.");
  t.slide("ADOBEC  →  valid, length 6");

  a.clear();
  a.window(1, 5, "DOBEC");
  for (let i = 1; i <= 5; i++) a.highlight([i], "window");
  a.highlight([0], "bad");
  v.setAll({ window: 5, best: "ADOBEC" });
  t.say("Now squeeze from the left. Dropping that A breaks it, so six was the best this window could do.");
  t.slide("drop A  →  no longer valid");

  a.clear();
  a.window(9, 12, "BANC");
  for (let i = 9; i <= 12; i++) a.highlight([i], "window");
  a.highlight([9], "match"); a.highlight([10], "match"); a.highlight([12], "match");
  v.setAll({ window: 4, best: "BANC" });
  t.say("Growing on gives a shorter valid window later: B, A, N, C. Four letters.");
  t.slide("BANC  →  valid, length 4");

  a.clear(); a.windowClear();
  a.highlight([9, 10, 11, 12], "match");
  t.say("BANC is the shortest stretch holding all of A, B and C.");
  t.result("BANC");
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(6, 7);
  t.say("Grow right, and count off each letter as it is satisfied.");
  t.slide();
  t.line(9, 10, 11);
  t.say("Once nothing is missing, record the window.");
  t.slide();
  t.line(12, 13, 14);
  t.say("Then squeeze from the left until it breaks.");
  t.slide();

  t.text("otext", "Intuition", [
    "Grow the right until it works.",
    "Squeeze the left while it still works.",
    "Neither edge ever goes back.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Grow the right until it works, squeeze the left while it still works, and neither edge ever goes back.");
  t.slide();
}
