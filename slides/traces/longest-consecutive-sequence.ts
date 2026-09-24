import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "longest-consecutive-sequence", number: 128,
  title: "Longest Consecutive Sequence", difficulty: "Medium",
  pattern: "hash-set", tagline: "only start where a run starts",
};

const SRC = `seen = set(nums)
best = 0

for n in seen:
    if n - 1 in seen:
        continue

    length = 1
    while n + length in seen:
        length += 1
    best = max(best, length)`;

export function trace(t: Tracer) {
  const NUMS = [100, 4, 200, 1, 3, 2];

  t.section("hook");
  t.say("Longest Consecutive Sequence, in linear time.");
  t.slide("The longest run of consecutive numbers");

  const pn = t.array("pn", NUMS, { label: "nums" });
  t.section("problem", { show: ["pn"] });
  t.say("Find the longest run of consecutive numbers hiding in here.");
  t.slide("longest consecutive run");
  t.say("Sorting would find it, but that costs n log n. We want linear.");
  t.slide("sorting costs n log n — we want O(n)");

  /* ── walkthrough ────────────────────────────────────── */
  const a = t.array("a", NUMS, { label: "nums" });
  const s = t.set("s", { label: "seen" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["a", ["s", "v"]] });

  for (const n of NUMS) s.add(n);
  t.say("Drop everything into a set, so asking whether a number exists is instant.");
  t.slide("seen = set(nums)");

  let best = 0;
  v.set("best", best);

  /**
   * The whole idea: a number is only worth walking from if it has no left neighbour.
   * That makes every run counted exactly once, so the total work stays linear.
   */
  const order = [100, 4, 1];
  for (let k = 0; k < order.length; k++) {
    const n = order[k];
    const i = NUMS.indexOf(n);
    a.clear();
    a.tagClear();
    a.highlight([i], "active");
    t.say(`Look at ${n}.`);
    t.slide(`on ${n}`);

    const hasLeft = s.has(n - 1);
    a.tag(i, `is ${n - 1} here?`, hasLeft ? "have" : "miss");
    t.say(`Ask whether ${n - 1} is in the set — that would mean ${n} sits in the middle of a run.`);
    t.slide(`${n} − 1 = ${n - 1} in the set?`);

    if (hasLeft) {
      a.highlight([i], "dim");
      t.say(`It is, so ${n} is not the start of anything. Skip it.`);
      t.slide(`yes  →  ${n} isn't a start, skip`);
      continue;
    }

    a.tag(i, "a run starts here", "have");
    t.say(`It isn't, so ${n} begins a run. Now walk upwards.`);
    t.slide(`no  →  ${n} starts a run`);

    let length = 1;
    const cells = [i];
    while (s.has(n + length)) {
      const j = NUMS.indexOf(n + length);
      cells.push(j);
      length++;
      a.clear();
      for (const c of cells) a.highlight([c], "match");
      v.set("run", length);
      t.say(`${n + length - 1} is there too, so the run is now ${length} long.`);
      t.slide(`${n + length - 1} found  ·  run = ${length}`);
    }

    if (length > best) {
      best = length;
      v.set("best", best);
      t.say(`That is the longest run so far.`);
      t.slide(`run ${length}  >  best  →  best = ${length}`);
    } else {
      t.say(`Only ${length} long, so the best stands.`);
      t.slide(`run ${length}  ≤  ${best}  →  keep ${best}`);
    }

    if (k === 0) {
      t.callout("Only walk from a number with no left neighbour", "insight");
      t.aside("Each run gets counted once, never twice.");
      t.say("This is the whole trick. Only numbers with nothing below them start a walk, so every run is counted exactly once and the total work stays linear.");
      t.slide("start only where a run starts");
    }
  }

  a.clear(); a.tagClear();
  a.highlight([1, 3, 4, 5], "match");
  t.say("One, two, three, four — four in a row is the longest.");
  t.result(best);
  t.slide();

  /* ── code ───────────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1);
  t.say("A set, so membership is instant.");
  t.slide();
  t.line(5, 6);
  t.say("Skip anything with a left neighbour — it is not a start.");
  t.slide();
  t.line(8, 9, 10);
  t.say("From a real start, walk up while the next number exists.");
  t.slide();

  t.text("otext", "Intuition", [
    "Only walk from a number",
    "that has nothing below it.",
    "Then every run is walked once.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Only walk from a number with nothing below it, and every run gets walked exactly once.");
  t.slide();
}
