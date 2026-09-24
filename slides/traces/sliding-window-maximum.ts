import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "sliding-window-maximum", number: 239,
  title: "Sliding Window Maximum", difficulty: "Hard",
  pattern: "monotonic-deque", tagline: "forget anyone a newcomer beats",
};

const SRC = `dq, out = deque(), []

for i, n in enumerate(nums):
    while dq and nums[dq[-1]] < n:
        dq.pop()
    dq.append(i)

    if dq[0] <= i - k:
        dq.popleft()
    if i >= k - 1:
        out.append(nums[dq[0]])`;

export function trace(t: Tracer) {
  const NUMS = [1, 3, -1, -3, 5];
  const K = 3;

  t.section("hook");
  t.say("Sliding Window Maximum, in one pass.");
  t.slide("The largest in every window");

  const pn = t.array("pn", NUMS, { label: "nums · k = 3" });
  t.section("problem", { show: ["pn"] });
  t.say("Slide a window of three along, and report the largest number in each one.");
  t.slide("largest in each window of 3");
  t.say("Rescanning every window is k times the work. We want to reuse what we already know.");
  t.slide("rescanning each window is too slow");

  const a = t.array("a", NUMS, { label: "nums · k = 3" });
  const d = t.queue("d", { label: "candidates, biggest first" });
  t.section("walkthrough", { show: ["a", "d"] });

  t.callout("A newcomer makes every smaller number behind it useless", "insight");
  t.aside("They can never win again.");
  t.say("If a new number is bigger than someone already waiting, that older, smaller number can never be the maximum again — the newcomer outlives it and beats it. So drop it.");
  t.slide("bigger newcomer  →  drop the smaller ones");

  const dq: number[] = [];
  const out: number[] = [];

  for (let i = 0; i < NUMS.length; i++) {
    const n = NUMS[i];
    a.clear();
    a.highlight([i], "active");
    for (const j of dq) a.highlight([j], "compare");
    t.say(`${n} arrives.`);
    t.slide(`on ${n}`);

    while (dq.length && NUMS[dq[dq.length - 1]] < n) {
      const dropped = NUMS[dq[dq.length - 1]];
      dq.pop();
      d.pop();
      t.say(`${dropped} is smaller and older, so it can never win again. Drop it.`);
      t.slide(`${dropped} < ${n}  →  drop`);
    }

    dq.push(i);
    d.push(n);
    t.say(`${n} joins the back.`);
    t.slide(`push ${n}`);

    if (dq[0] <= i - K) {
      const gone = NUMS[dq[0]];
      dq.shift();
      d.dequeue();
      t.say(`${gone} has fallen out of the window.`);
      t.slide(`${gone} left the window`);
    }

    if (i >= K - 1) {
      out.push(NUMS[dq[0]]);
      a.clear();
      a.window(i - K + 1, i, `window`);
      for (let j = i - K + 1; j <= i; j++) a.highlight([j], "window");
      a.highlight([dq[0]], "match");
      t.say(`The front of the queue is the largest in this window: ${NUMS[dq[0]]}.`);
      t.slide(`max = ${NUMS[dq[0]]}`);
    }
  }

  a.clear(); a.windowClear();
  t.say("Each number joins once and leaves once, so the whole thing is linear.");
  t.result(out);
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(4, 5, 6);
  t.say("Drop everyone smaller from the back, then join it.");
  t.slide();
  t.line(8, 9);
  t.say("Drop the front if it has slid out of the window.");
  t.slide();
  t.line(10, 11);
  t.say("The front is always the answer for this window.");
  t.slide();

  t.text("otext", "Intuition", [
    "Keep only the numbers",
    "that could still win.",
    "A bigger newcomer retires the rest.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Keep only the numbers that could still win. A bigger newcomer retires the rest.");
  t.slide();
}
