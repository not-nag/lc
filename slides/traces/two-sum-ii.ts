import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "two-sum-ii", number: 167,
  title: "Two Sum II — Sorted Array", difficulty: "Medium",
  pattern: "two-pointers", tagline: "sorted changes everything",
};

const SRC = `l, r = 0, len(nums) - 1

while l < r:
    total = nums[l] + nums[r]
    if total == target:
        return [l + 1, r + 1]
    if total < target:
        l += 1
    else:
        r -= 1`;

export function trace(t: Tracer) {
  const NUMS = [2, 3, 5, 8, 11, 15];
  const TARGET = 13;

  t.section("hook");
  t.say("Two Sum again — but the array is sorted, and that changes everything.");
  t.slide("Sorted, so no map needed");

  const pn = t.array("pn", NUMS, { label: "nums · target 13" });
  t.section("problem", { show: ["pn"] });
  t.say("Find the pair adding to thirteen.");
  t.slide("two numbers adding to 13");
  t.say("A hash map would work, but sorted order gives us something better: direction.");
  t.slide("sorted — we can steer");

  const a = t.array("a", NUMS, { label: "nums · target 13" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["a", "v"] });

  let l = 0, r = NUMS.length - 1;
  a.pointer("l", l, "danger");
  a.pointer("r", r, "success");
  t.say("Start as wide as possible — the smallest number and the largest.");
  t.slide("start at both ends");

  let found: number[] = [];
  let step = 0;
  while (l < r) {
    const sum = NUMS[l] + NUMS[r];
    a.clear();
    a.highlight([l], "compare");
    a.highlight([r], "compare");
    v.setAll({ sum });
    t.say(`${NUMS[l]} plus ${NUMS[r]} is ${sum}.`);
    t.slide(`${NUMS[l]} + ${NUMS[r]} = ${sum}`);

    if (sum === TARGET) {
      a.highlight([l, r], "match");
      a.link(l, r, `${NUMS[l]} + ${NUMS[r]} = ${TARGET}`);
      found = [l + 1, r + 1];
      t.say("That is the target.");
      t.slide(`= ${TARGET}  →  found`);
      break;
    }

    if (sum < TARGET) {
      t.say(`Too small. The right end is already the biggest number available, so the only way up is to raise the left.`);
      t.slide(`${sum} < ${TARGET}  →  move left in`);
      a.move("l", ++l);
    } else {
      t.say(`Too big. The left is already the smallest, so the only way down is to lower the right.`);
      t.slide(`${sum} > ${TARGET}  →  move right in`);
      a.move("r", --r);
    }

    if (step === 0) {
      t.callout("Each move discards a whole row of pairs, safely", "insight");
      t.aside("Sorted order is the proof.");
      t.say("This is why sorting matters. If the sum is too small, no pair using that left number can ever reach the target, because its partner is already the largest. So the entire left column can be thrown away in one step.");
      t.slide("one move rules out many pairs");
    }
    step++;
  }

  a.clear(); a.drop("l"); a.drop("r");
  a.highlight([1, 4], "match");
  t.say("Two and eleven — positions two and five, counting from one.");
  t.result(found);
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1);
  t.say("Both ends.");
  t.slide();
  t.line(4, 5, 6);
  t.say("Hit the target and we are done.");
  t.slide();
  t.line(7, 8, 9, 10);
  t.say("Too small, raise the floor. Too big, lower the ceiling.");
  t.slide();

  t.text("otext", "Intuition", [
    "Too small? Only the left can help.",
    "Too big? Only the right can.",
    "Sorted order tells you which way to move.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Sorted order tells you which way to move, so every step rules out a whole set of pairs.");
  t.slide();
}
