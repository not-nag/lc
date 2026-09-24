import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "container-with-most-water", number: 11,
  title: "Container With Most Water", difficulty: "Medium",
  pattern: "two-pointers", tagline: "your weakest wall decides",
};

const SRC = `left, right = 0, n - 1
best = 0

while left < right:
    depth = min(height[left], height[right])
    water = depth * (right - left)
    best  = max(best, water)

    if height[left] < height[right]: left += 1
    else: right -= 1`;

export function trace(t: Tracer) {
  const H = [1, 8, 6, 2, 5, 4, 8, 3, 7];

  t.section("hook");
  t.say("Container With Most Water.");
  t.slide("Two walls. Most water.");

  const pb = t.bars("pb", H, { label: "wall heights" });
  t.section("problem", { show: ["pb"] });
  t.say("Each bar is a wall. Pick two, and they hold water between them.");
  t.slide("each bar is a wall");
  t.say("Depth is the shorter wall, width is the gap between them. Find the biggest.");
  t.slide("depth = shorter wall  ·  width = gap");

  const b = t.bars("b", H, { label: "wall heights" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["b", "v"] });

  let l = 0, r = H.length - 1, best = 0;
  b.pointer("L", l, "danger");
  b.pointer("R", r, "success");
  let depth = Math.min(H[l], H[r]);
  best = depth * (r - l);
  b.area(l, r, depth, `${depth} × ${r - l} = ${best}`);
  v.set("best", best);
  t.say("Start as wide as possible. Depth one, width eight — eight units.");
  t.slide(`1 × 8 = ${best}`);

  let step = 0;
  while (l < r) {
    const moveLeft = H[l] < H[r];
    const shortIdx = moveLeft ? l : r;

    if (step === 0) {
      b.highlight([shortIdx], "bad");
      t.say(`${H[shortIdx]} is the shorter wall, so it is what caps the water.`);
      t.slide("the short wall caps the water");

      t.callout("Move the shorter wall — always", "insight");
      t.aside("The tall wall is not the problem.");
      t.say("Move the tall one and the cap stays the same while the width shrinks, so it can only lose. The short one is the only move that can help.");
      t.slide("moving the tall wall can only lose");
    }

    if (moveLeft) l++; else r--;
    step++;
    if (l >= r) break;

    depth = Math.min(H[l], H[r]);
    const width = r - l;
    const area = depth * width;
    b.clear();
    b.move("L", l); b.move("R", r);
    b.highlight([l], "bad"); b.highlight([r], "match");
    b.area(l, r, depth, `${depth} × ${width} = ${area}`);

    const narrate = step <= 3;
    if (area > best) {
      const was = best;
      best = area;
      v.set("best", best);
      if (narrate) t.say(`${depth} deep, ${width} wide — that is ${area}, beating ${was}.`);
      t.slide(`${depth} × ${width} = ${area}  >  ${was}`);
    } else {
      if (narrate) t.say(`${depth} deep, ${width} wide — only ${area}. Best stays ${best}.`);
      else if (step === 4) t.say("From here the gap keeps shrinking, so nothing catches up.");
      t.slide(`${depth} × ${width} = ${area}  ≤  ${best}`);
    }
  }

  b.clear(); b.drop("L"); b.drop("R"); b.areaClear();
  b.highlight([1], "match"); b.highlight([8], "match");
  b.area(1, 8, 7, "49");
  t.say("The pointers meet, and forty-nine is the most we could hold.");
  t.result(best, "Max water");
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1, 2);
  t.say("Start at both ends.");
  t.slide();
  t.line(4, 5, 6);
  t.say("Measure this pair.");
  t.slide();
  t.line(8, 9);
  t.say("Then step the shorter wall inward.");
  t.slide();

  t.text("otext", "Intuition", [
    "The width only ever shrinks.",
    "So the only way to win",
    "is a taller short wall.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("The width only ever shrinks, so the only way to win is a taller short wall.");
  t.slide();
}
