import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "3sum", number: 15, title: "3Sum", difficulty: "Medium",
  pattern: "two-pointers", tagline: "fix one, chase two",
};

const SRC = `nums.sort()

for i in range(len(nums) - 2):
    if i and nums[i] == nums[i - 1]: continue
    l, r = i + 1, len(nums) - 1
    while l < r:
        total = nums[i] + nums[l] + nums[r]
        if total < 0: l += 1
        elif total > 0: r -= 1
        else:
            out.append([nums[i], nums[l], nums[r]])
            l += 1`;

export function trace(t: Tracer) {
  const SORTED = [-4, -1, -1, 0, 1, 2];

  t.section("hook");
  t.say("3Sum. Three numbers adding to zero.");
  t.slide("Three numbers that sum to zero");

  const pn = t.array("pn", SORTED, { label: "nums, sorted" });
  t.section("problem", { show: ["pn"] });
  t.say("Find every triple that adds to zero.");
  t.slide("every triple summing to 0");
  t.say("Trying all triples is cubic. But we already know how to find a pair in a sorted array.");
  t.slide("all triples is O(n³)");

  const a = t.array("a", SORTED, { label: "nums, sorted" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["a", "v"] });

  t.say("Sort first. Then fix one number and hunt for the pair that cancels it.");
  t.slide("sort, then fix one number");

  const out: number[][] = [];
  for (let i = 0; i < 3; i++) {
    if (i > 0 && SORTED[i] === SORTED[i - 1]) {
      a.clear();
      a.highlight([i], "dim");
      t.say(`Same value as the one before, so it would only repeat the same triples. Skip it.`);
      t.slide(`${SORTED[i]} repeats  →  skip`);
      continue;
    }

    let l = i + 1, r = SORTED.length - 1;
    a.clear();
    a.highlight([i], "active");
    if (i === 0) { a.pointer("l", l, "danger"); a.pointer("r", r, "success"); }
    else { a.move("l", l); a.move("r", r); }
    v.set("fixed", SORTED[i]);
    t.say(`Fix ${SORTED[i]}. Now the other two have to add to ${-SORTED[i]}.`);
    t.slide(`fix ${SORTED[i]}  →  need ${-SORTED[i]}`);

    if (i === 0) {
      t.callout("Fixing one number turns 3Sum into 2Sum", "insight");
      t.aside("A problem you have already solved.");
      t.say("That is the whole move. With one number pinned, the rest is the sorted two-pointer search we already know.");
      t.slide("the rest is Two Sum on a sorted array");
    }

    let guard = 0;
    while (l < r && guard++ < 5) {
      const sum = SORTED[i] + SORTED[l] + SORTED[r];
      a.clear();
      a.highlight([i], "active");
      a.highlight([l], "compare");
      a.highlight([r], "compare");
      v.set("sum", sum);
      t.say(`${SORTED[i]} plus ${SORTED[l]} plus ${SORTED[r]} is ${sum}.`);
      t.slide(`${SORTED[i]} + ${SORTED[l]} + ${SORTED[r]} = ${sum}`);

      if (sum === 0) {
        out.push([SORTED[i], SORTED[l], SORTED[r]]);
        a.highlight([i, l, r], "match");
        t.say("Zero. That is a triple.");
        t.slide("= 0  →  keep it");
        a.move("l", ++l);
        break;
      }
      if (sum < 0) { t.slide(`${sum} < 0  →  move left in`); a.move("l", ++l); }
      else { t.slide(`${sum} > 0  →  move right in`); a.move("r", --r); }
    }
  }

  a.clear(); a.drop("l"); a.drop("r");
  a.highlight([0, 3, 5], "match");
  t.say("Two triples, and no duplicates, because we skipped repeated values.");
  t.result(out.map((x) => x.join("+")));
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1, 3);
  t.say("Sort, then pin each number in turn.");
  t.slide();
  t.line(4);
  t.say("Skip a repeat, or the same triple comes out twice.");
  t.slide();
  t.line(5, 6, 7, 8, 9);
  t.say("The rest is the sorted two-pointer search.");
  t.slide();

  t.text("otext", "Intuition", [
    "Pin one number.",
    "What is left is Two Sum",
    "on a sorted array.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Pin one number, and what is left is Two Sum on a sorted array.");
  t.slide();
}
