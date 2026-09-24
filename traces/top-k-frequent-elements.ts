import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "top-k-frequent-elements", number: 347,
  title: "Top K Frequent Elements", difficulty: "Medium",
  pattern: "bucket-sort", tagline: "no heap required",
};

const SRC = `count = Counter(nums)
buckets = [[] for _ in range(n + 1)]

for num, freq in count.items():
    buckets[freq].append(num)

out = []
for freq in range(n, 0, -1):
    for num in buckets[freq]:
        out.append(num)
        if len(out) == k: return out`;

export function trace(t: Tracer) {
  const NUMS = [1, 1, 1, 2, 2, 3];
  const K = 2;

  t.section("hook");
  t.say("Top K Frequent Elements, without a heap.");
  t.slide("The k most common numbers");

  const pn = t.array("pn", NUMS, { label: "nums · k = 2" });
  t.section("problem", { show: ["pn"] });
  t.say("Return the two numbers that appear most often.");
  t.slide("the 2 most frequent numbers");
  t.say("A heap would do it in n log k. But there is a bound we can exploit.");
  t.slide("a heap costs n log k");

  /* ── walkthrough ────────────────────────────────────── */
  const a = t.array("a", NUMS, { label: "nums" });
  const c = t.map("c", { label: "number  →  count" });
  t.section("walkthrough", { show: ["a", "c"] });

  const counts = new Map<number, number>();
  for (let i = 0; i < NUMS.length; i++) {
    const n = NUMS[i];
    const prev = counts.get(n) ?? 0;
    counts.set(n, prev + 1);
    a.clear();
    a.highlight([i], "active");
    c.put(String(n), prev + 1);
    t.say(`${n} again, so its count rises to ${prev + 1}.`);
    t.slide(`${n}  →  ${prev + 1}`);
  }

  a.clear();
  t.say("Now the key observation: no number can appear more times than there are numbers. So frequency itself fits in a small range.");
  t.slide("a count can never exceed n");

  /* buckets indexed BY frequency — the invariant on screen */
  const b = t.array("b", ["", "", "", "", "", "", ""], { label: "buckets — index is the frequency" });
  // the counts have done their job; the buckets get the stage to themselves
  t.section("walkthrough", { show: ["b"], id: "buckets" });

  t.callout("Use the count as an index, not a value", "insight");
  t.aside("Sorting by frequency, without sorting.");
  t.say("So make an array where the index is the frequency. A number counted three times goes in slot three.");
  t.slide("bucket[count] holds the numbers with that count");

  for (const [n, freq] of counts) {
    b.clear();
    b.set(freq, String(n));
    b.highlight([freq], "match");
    t.say(`${n} appeared ${freq} time${freq > 1 ? "s" : ""}, so it goes in slot ${freq}.`);
    t.slide(`${n} appears ${freq}×  →  bucket[${freq}]`);
  }

  b.clear();
  const out: number[] = [];
  for (let f = 6; f >= 1 && out.length < K; f--) {
    const here = [...counts.entries()].filter(([, v]) => v === f).map(([n]) => n);
    b.clear();
    b.highlight([f], "active");
    if (here.length === 0) {
      t.say(`Nothing appeared ${f} times.`);
      t.slide(`bucket[${f}] empty`);
      continue;
    }
    out.push(...here);
    b.highlight([f], "match");
    t.say(`${here.join(" and ")} appeared ${f} times — take ${here.length === 1 ? "it" : "them"}.`);
    t.slide(`bucket[${f}] → take ${here.join(", ")}`);
  }

  b.clear();
  t.say("Walking the buckets from the right gives the most frequent first. Two taken, and we are done.");
  t.result(out);
  t.slide();

  /* ── code ───────────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1, 2);
  t.say("Count everything, then make one bucket per possible frequency.");
  t.slide();
  t.line(4, 5);
  t.say("File each number under its own count.");
  t.slide();
  t.line(8, 9, 10, 11);
  t.say("Walk the buckets backwards and take the first k.");
  t.slide();

  t.text("otext", "Intuition", [
    "A count can never exceed n,",
    "so the count can be an index.",
    "Then the buckets are already sorted.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("A count can never exceed n, so use the count as an index and the buckets come out already sorted.");
  t.slide();
}
