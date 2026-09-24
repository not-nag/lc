import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "two-sum", number: 1, title: "Two Sum", difficulty: "Easy",
  pattern: "hashmap-one-pass", fps: 30, width: 1080, height: 1920,
  framesPerBeat: 12,
  tagline: "one pass, no regrets",
};

const SRC = `seen = {}

for i, num in enumerate(nums):
    need = target - num
    if need in seen:
        return [seen[need], i]
    seen[num] = i`;

export function trace(t: Tracer) {
  /**
   * Every "needs" value is a plausible number, never a negative nobody would look for.
   * And at index 2, 7 needs 2 — which EXISTS, one cell ahead. That near miss is the
   * whole lesson: only what's behind you counts.
   */
  const NUMS = [3, 5, 7, 2];
  const TARGET = 9;

  /* ── hook ───────────────────────────────────────────── */
  t.scene("hook", { transition: "cut" });
  t.say("Two Sum, under 100 seconds.");
  t.beat("Two numbers that add to 9", 6);

  /* ── the ask ────────────────────────────────────────── */
  const pn = t.array("pn", NUMS, { label: "nums · target 9" });
  t.scene("problem", { show: ["pn"] });
  t.say("Four numbers, and a target of nine.");
  t.beat("target = 9", 7);
  pn.highlight([2, 3], "match");
  pn.link(2, 3, "7 + 2 = 9");
  t.say("Two of them add up to it.");
  t.beat("7 + 2 = 9", 7);
  pn.clear(); pn.linkClear();
  t.say("We want their positions — index two and index three.");
  t.beat("answer = [2, 3]", 7);

  /* ── the walkthrough: one change per beat ───────────── */
  const a = t.array("a", NUMS, { label: "nums · target 9" });
  t.scene("walkthrough", { show: ["a"] });

  t.say("We walk left to right, one number at a time.");
  t.beat("Walk left to right", 6);

  const seen = new Map<number, number>();

  for (let i = 0; i < NUMS.length; i++) {
    const num = NUMS[i];
    const need = TARGET - num;
    const hit = seen.has(need);
    const slow = i === 0 || i === NUMS.length - 1;   // establish, then land

    /* 1 — arrive. nothing else moves. */
    a.clear();
    for (let k = 0; k < i; k++) a.highlight([k], "visited");
    if (i > 0) a.window(0, i - 1, "remembered");
    a.highlight([i], "active");   // the lit cell + its tag already say where we are
    t.say(i === 0 ? "Start on the first number, three." : `Move on to ${num}.`);
    t.beat(`on ${num}`, slow ? 5 : 4);

    /* 2 — ask the question. */
    a.tag(i, `needs ${need}`);
    t.say(i === 0
      ? `Three needs six to make nine. So the question is: have we already seen a six?`
      : `${num} needs ${need}.`);
    t.beat(`${num} + ${need} = ${TARGET}`, slow ? 6 : 4);

    /* 3 — actually look behind. the search is a visible event. */
    if (i === 0) {
      t.say("There's nothing behind us yet, so no.");
      t.beat("nothing behind us", 5);
    } else {
      for (let k = 0; k < i; k++) a.highlight([k], "compare");
      t.say(`Look back at everything we've passed. Is ${need} in there?`);
      t.beat(`is ${need} behind us?`, slow ? 6 : 4);
    }

    /* 4 — the answer. */
    if (hit) {
      const j = seen.get(need)!;
      a.clear();
      a.windowClear();
      a.tag(i, `found ${need}`, "have");
      a.highlight([j, i], "match");
      a.link(j, i, `${need} + ${num} = ${TARGET}`);
      t.say(`Yes. ${need} went past at index ${j}. That's the pair.`);
      t.beat(`yes — index ${j}`, 7);
      a.tagClear();
      t.result([j, i]);
      t.beat("", 6);
      break;
    }

    for (let k = 0; k < i; k++) a.highlight([k], "visited");
    a.tag(i, `no ${need}`, "miss");
    t.say(i === 0 ? "So three joins the crowd behind us." : `No ${need}. So ${num} joins the crowd.`);
    t.beat(`remember ${num}`, slow ? 5 : 4);
    seen.set(num, i);

    /* the near miss — 2 is one cell ahead, and that is exactly why it doesn't count */
    if (i === 2) {
      a.highlight([i], "done");            // step off the current cell
      a.highlight([3], "bad");
      a.tag(3, "not yet — ahead", "miss");
      t.say("But look — a two is sitting right there. One cell ahead.");
      t.beat("the 2 is right there", 7);
      t.callout("Ahead doesn't count. Only behind.", "insight");
      t.aside("We haven't met it yet.");
      t.say("We haven't reached it yet, so we can't use it. We only ever look behind.");
      t.beat("only what's behind us counts", 8);
      a.clear();
      for (let k = 0; k <= i; k++) a.highlight([k], "visited");
      a.window(0, i, "remembered");
      t.say("Keep walking.");
      t.beat("", 4);
    }
  }

  /* ── the code ───────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code snippet", [], "plain");
  t.scene("complexity", { show: ["ctext", "code"] });
  t.line(1);
  t.say("A map of everything behind us: value to index.");
  t.beat("", 5);
  t.line(3, 4);
  t.say("For each number, work out what it needs.");
  t.beat("", 5);
  t.line(5, 6);
  t.say("If that partner already went past, we're done.");
  t.beat("", 5);
  t.line(7);
  t.say("Otherwise remember this one, and keep walking.");
  t.beat("", 5);

  /* ── intuition ──────────────────────────────────────── */
  t.text("otext", "Intuition", [
    "Remember everything you've seen.",
    "Then just check whether it fits the one you're on.",
  ], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.say("Remember everything you've seen. Then check whether it fits the one you're on.");
  t.beat("", 9);
  t.say("One pass. That's Two Sum under 100 seconds.");
  t.beat("O(n) time · O(n) space", 7);
}
