import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "trapping-rain-water", number: 42,
  title: "Trapping Rain Water", difficulty: "Hard",
  pattern: "two-pointers", tagline: "the shorter side decides",
};

const SRC = `l, r = 0, len(h) - 1
maxL, maxR, total = h[l], h[r], 0

while l < r:
    if maxL < maxR:
        l += 1
        maxL = max(maxL, h[l])
        total += maxL - h[l]
    else:
        r -= 1
        maxR = max(maxR, h[r])
        total += maxR - h[r]`;

export function trace(t: Tracer) {
  const H = [4, 2, 0, 3, 2, 5];

  t.section("hook");
  t.say("Trapping Rain Water, in one pass and no extra arrays.");
  t.slide("How much water sits on top?");

  const pb = t.bars("pb", H, { label: "heights" });
  t.section("problem", { show: ["pb"] });
  t.say("Rain falls on this skyline. How much water stays trapped?");
  t.slide("water trapped after rain");
  t.say("A dip holds water only if something taller stands on both sides.");
  t.slide("needs a taller wall on both sides");

  const b = t.bars("b", H, { label: "heights" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["b", "v"] });

  let l = 0, r = H.length - 1;
  let maxL = H[l], maxR = H[r], total = 0;
  b.pointer("L", l, "danger");
  b.pointer("R", r, "success");
  v.setAll({ maxL, maxR, water: 0 });
  t.say("The water above any column is the shorter of the tallest wall to its left and the tallest to its right, minus the column itself.");
  t.slide("water = min(tallest left, tallest right) − height");

  t.callout("The shorter side is already decided", "insight");
  t.aside("You never need to look further.");
  t.say("Here is the trick. If the tallest wall on the left is shorter than the tallest on the right, then the left one is what limits the water — whatever else lies to the right cannot lower it. So that column can be settled immediately.");
  t.slide("the smaller max is the binding wall");

  let guard = 0;
  while (l < r && guard++ < 8) {
    if (maxL < maxR) {
      l++;
      maxL = Math.max(maxL, H[l]);
      const add = maxL - H[l];
      total += add;
      b.clear();
      b.move("L", l);
      b.highlight([l], "active");
      b.level(maxL, `left wall ${maxL}`);
      if (add > 0) b.gap(l, `+${add}`);
      v.setAll({ maxL, water: total });
      t.say(add > 0
        ? `Left max is ${maxL} and this column is ${H[l]}, so ${add} units sit on top.`
        : `This column is at least as tall as the wall behind it, so nothing collects.`);
      t.slide(add > 0 ? `${maxL} − ${H[l]} = ${add}` : `no water here`);
    } else {
      r--;
      maxR = Math.max(maxR, H[r]);
      const add = maxR - H[r];
      total += add;
      b.clear();
      b.move("R", r);
      b.highlight([r], "active");
      b.level(maxR, `right wall ${maxR}`);
      if (add > 0) b.gap(r, `+${add}`);
      v.setAll({ maxR, water: total });
      t.say(add > 0
        ? `Right max is ${maxR} and this column is ${H[r]}, so ${add} units sit on top.`
        : `Nothing collects here.`);
      t.slide(add > 0 ? `${maxR} − ${H[r]} = ${add}` : `no water here`);
    }
  }

  b.clear(); b.drop("L"); b.drop("R"); b.gapClear(); b.levelClear();
  t.say("Nine units, settled one column at a time.");
  t.result(total, "Water");
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1, 2);
  t.say("Both ends, and the tallest wall seen from each side.");
  t.slide();
  t.line(5, 6, 7, 8);
  t.say("Whichever side has the shorter wall is the one that is settled, so move it.");
  t.slide();

  t.text("otext", "Intuition", [
    "Water is capped by the shorter",
    "of the two tallest walls.",
    "So settle that side first.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Water is capped by the shorter of the two tallest walls, so that side can always be settled first.");
  t.slide();
}
