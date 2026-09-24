import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "container-with-most-water", number: 11,
  title: "Container With Most Water", difficulty: "Medium",
  pattern: "two-pointers", fps: 30, width: 1080, height: 1920,
  framesPerBeat: 12,
  tagline: "hold as much as you can, then let go",
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

  /* ── hook ───────────────────────────────────────────── */
  t.scene("hook", { transition: "cut" });
  t.say("Container With Most Water, under 100 seconds.");
  t.beat("Two walls. Most water.", 5);

  /* ── the ask ────────────────────────────────────────── */
  const pb = t.bars("pb", H, { label: "wall heights" });
  t.scene("problem", { show: ["pb"] });
  t.say("Each bar is a wall. Pick two — they hold water between them.");
  t.beat("Each bar is a wall", 4);
  pb.highlight([1], "active"); pb.highlight([8], "active");
  pb.area(1, 8, 7, "7 × 7 = 49");
  t.say("Depth is the shorter wall, width is the gap. Find the biggest.");
  t.beat("depth = shorter wall · width = gap", 6);

  /* ── dry run ────────────────────────────────────────── */
  const b = t.bars("b", H, { label: "wall heights" });
  const v = t.vars("v");
  t.scene("walkthrough", { show: ["b", "v"] });

  let l = 0, r = H.length - 1, best = 0;
  b.pointer("L", l, "danger");
  b.pointer("R", r, "success");
  b.highlight([l], "bad"); b.highlight([r], "match");
  const a0 = Math.min(H[l], H[r]) * (r - l);
  b.area(l, r, Math.min(H[l], H[r]), `${Math.min(H[l], H[r])} × ${r - l} = ${a0}`);
  best = a0; v.setAll({ best });
  t.say("Start as wide as possible. Depth 1, width 8 — 8 units.");
  t.beat(`1 × 8 = ${a0}`, 6);

  let step = 0;
  while (l < r) {
    const moveLeft = H[l] < H[r];
    const shorterIdx = moveLeft ? l : r;
    const shorter = H[shorterIdx];

    // the reason, said once, the first time it matters
    if (step === 0) {
      b.highlight([shorterIdx], "bad");
      t.say(`${shorter} is the shorter wall, so it caps the water.`);
      t.beat("The short wall caps the water", 5);

      t.callout("Move the shorter wall — always", "insight");
      t.aside("The tall wall is not the problem.");
      t.say("Move the tall one and the cap stays but the width shrinks. It can never help. So we always move the short one.");
      t.beat("Moving the tall wall can only lose", 7);
    }

    if (moveLeft) l++; else r--;
    step++;
    if (l >= r) break;

    const depth = Math.min(H[l], H[r]);
    const width = r - l;
    const area = depth * width;

    b.clear();
    b.move("L", l); b.move("R", r);
    b.highlight([l], "bad"); b.highlight([r], "match");
    b.area(l, r, depth, `${depth} × ${width} = ${area}`);

    const narrate = step <= 3;                  // the idea lands in the first few checks
    const beats = step <= 2 ? 6 : narrate ? 5 : 2;
    if (area > best) {
      const was = best;              // report the value we beat, not the one we just set
      best = area;
      v.set("best", best);
      t.say(`${depth} deep, ${width} wide — that's ${area}. Beats ${was}, so best becomes ${area}.`);
      t.beat(`${depth} × ${width} = ${area}  >  ${was}  →  best = ${area}`, beats);
    } else {
      if (narrate) t.say(`${depth} deep, ${width} wide — only ${area}. Best stays ${best}.`);
      else if (step === 4) t.say("From here the gap keeps shrinking, so nothing catches up.");
      t.beat(`${depth} × ${width} = ${area}  <  ${best}  →  keep ${best}`, beats);
    }
  }

  b.clear(); b.drop("L"); b.drop("R"); b.areaClear();
  b.highlight([1], "match"); b.highlight([8], "match");
  b.area(1, 8, 7, "49");
  t.say("The pointers meet. 49 is the most we could hold.");
  t.result(best, "Max water");
  t.beat("", 6);

  /* ── the code ───────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", undefined, ["That's the whole algorithm."], "big");
  t.scene("complexity", { show: ["ctext", "code"] });
  t.say("Start wide, measure, step the shorter wall in.");
  t.line(1, 2);
  t.beat("Start at both ends", 5);
  t.line(4, 5, 6);
  t.say("Width only shrinks, so the only way to win is a taller short wall.");
  t.line(9, 10);
  t.beat("Width only shrinks · chase height", 6);
  t.say("One pass from both sides. Nothing stored.");
  t.line();
  t.beat("O(n) time · O(1) space", 5);

  /* ── outro ──────────────────────────────────────────── */
  t.text("otext", undefined, ["Your weakest wall", "decides how much you hold."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.say("That's Container With Most Water, under 100 seconds. See ya.");
  t.beat("", 7);
}
