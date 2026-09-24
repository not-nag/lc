import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "product-of-array-except-self", number: 238,
  title: "Product of Array Except Self", difficulty: "Medium",
  pattern: "prefix-suffix", tagline: "no division, no problem",
};

const SRC = `out = [1] * n

running = 1
for i in range(n):
    out[i] = running
    running *= nums[i]

running = 1
for i in range(n - 1, -1, -1):
    out[i] *= running
    running *= nums[i]`;

export function trace(t: Tracer) {
  const NUMS = [1, 2, 3, 4];

  t.section("hook");
  t.say("Product of Array Except Self, without dividing.");
  t.slide("Every product except your own");

  const pn = t.array("pn", NUMS, { label: "nums" });
  t.section("problem", { show: ["pn"] });
  t.say("For each position, multiply everything except the number sitting there.");
  t.slide("out[i] = product of everything but nums[i]");
  t.say("Dividing the total product would be easy — but a single zero breaks it, and the problem forbids it anyway.");
  t.slide("no division allowed");

  /* ── walkthrough: two sweeps ────────────────────────── */
  const a = t.array("a", NUMS, { label: "nums" });
  const out = t.array("out", [1, 1, 1, 1], { label: "out" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["a", "out", "v"] });

  t.say("Everything except me is everything on my left, times everything on my right.");
  t.slide("left of me  ×  right of me");

  /* left sweep */
  let running = 1;
  v.set("running", running);
  t.say("First sweep runs left to right, carrying the product of everything behind us.");
  t.slide("sweep 1 — from the left");

  for (let i = 0; i < NUMS.length; i++) {
    a.clear(); out.clear();
    a.highlight([i], "active");
    if (i > 0) a.window(0, i - 1, "behind us");
    out.set(i, running);
    out.highlight([i], "match");
    t.say(`Everything to the left of ${NUMS[i]} multiplies to ${running}.`);
    t.slide(`out[${i}] = ${running}`);

    running *= NUMS[i];
    v.set("running", running);
    t.say(`Fold ${NUMS[i]} in and carry on.`);
    t.slide(`running × ${NUMS[i]} = ${running}`);
  }

  /* right sweep */
  a.clear(); out.clear(); a.windowClear();
  running = 1;
  v.set("running", running);
  t.callout("The same trick, walked backwards", "insight");
  t.say("Now the same sweep in reverse, multiplying in everything ahead.");
  t.slide("sweep 2 — from the right");

  const res = [...NUMS].map(() => 0);
  let r = 1;
  for (let i = NUMS.length - 1; i >= 0; i--) {
    a.clear(); out.clear();
    a.highlight([i], "active");
    if (i < NUMS.length - 1) a.window(i + 1, NUMS.length - 1, "ahead of us");
    const before = out.at(i) as number;
    out.set(i, before * r);
    res[i] = before * r;
    out.highlight([i], "match");
    t.say(`Everything to the right multiplies to ${r}, so out[${i}] becomes ${before * r}.`);
    t.slide(`${before} × ${r} = ${before * r}`);

    r *= NUMS[i];
    v.set("running", r);
    t.slide(`running × ${NUMS[i]} = ${r}`);
  }

  a.clear(); a.windowClear(); out.clear();
  out.highlight([0, 1, 2, 3], "match");
  t.say("Two sweeps, no division, and every position holds the product of all the others.");
  t.result(res);
  t.slide();

  /* ── code ───────────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(3, 4, 5, 6);
  t.say("Left to right, writing the product of everything behind.");
  t.slide();
  t.line(8, 9, 10, 11);
  t.say("Right to left, multiplying in everything ahead.");
  t.slide();

  t.text("otext", "Intuition", [
    "Everything except me",
    "is everything on my left",
    "times everything on my right.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Everything except me is everything on my left times everything on my right.");
  t.slide();
}
