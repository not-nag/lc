import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "best-time-to-buy-and-sell-stock", number: 121,
  title: "Best Time to Buy and Sell Stock", difficulty: "Easy",
  pattern: "single-pass-min", fps: 30, width: 1080, height: 1920,
  framesPerBeat: 12,
  tagline: "buy low, sell high, scroll on",
};

const SRC = `cheapest = prices[0]
best     = 0

for price in prices:
    best     = max(best, price - cheapest)
    cheapest = min(cheapest, price)`;

export function trace(t: Tracer) {
  const P = [7, 1, 5, 3, 6, 4];

  /* ── hook ───────────────────────────────────────────── */
  t.scene("hook", { transition: "cut" });
  t.say("Best Time to Buy and Sell Stock, under 100 seconds.");
  t.beat("Buy once. Sell later. Biggest profit.", 6);

  /* ── the ask — two beats ───────────────────────────── */
  const pb = t.bars("pb", P, { label: "price by day" });
  t.scene("problem", { show: ["pb"] });
  t.say("A week of prices.");
  t.beat("Six days of prices", 3);
  pb.highlight([1], "match");
  pb.highlight([4], "active");
  t.say("Buy on one day, sell on a later one. What's the most you can make?");
  t.beat("Buy low, sell later — max profit?", 5);

  /* ── dry run — one dense beat per day ───────────────── */
  const b = t.bars("b", P, { label: "price by day" });
  const v = t.vars("v");
  t.scene("walkthrough", { show: ["b", "v"] });

  let cheapest = P[0];
  let best = 0;
  b.pointer("day", 0, "primary");
  b.highlight([0], "active");
  b.level(cheapest, "cheapest 7");
  v.setAll({ cheapest, best });
  t.say("We carry two things: the cheapest price we've seen, and the best profit so far.");
  t.beat("Carry: cheapest, and best profit", 5);

  for (let i = 1; i < P.length; i++) {
    const p = P[i];
    const todays = p - cheapest;          // what selling today would earn
    const beatsFor = i <= 2 ? 6 : 5;      // linger where the idea forms

    b.clear();
    b.move("day", i);
    b.highlight([i], "active");
    b.gapClear();

    // Both checks the code makes, spoken with the real numbers — never just the outcome.
    let label: string;
    let line: string;

    if (todays > best) {
      b.gap(i, `+${todays}`);
      label = `${p} − ${cheapest} = ${todays}  >  ${best}   →  best = ${todays}`;
      line = `Day ${i + 1}. If we sell today, ${p} minus ${cheapest} is ${todays}. `
           + `That beats ${best}, so let's update best to ${todays}.`;
      best = todays;
      v.set("best", best);
    } else if (todays > 0) {
      b.gap(i, `+${todays}`);
      label = `${p} − ${cheapest} = ${todays}  <  ${best}   →  keep ${best}`;
      line = `Day ${i + 1}. Sell today and ${p} minus ${cheapest} is only ${todays}. `
           + `That's less than ${best}, so best stays.`;
    } else {
      label = `${p} − ${cheapest} = ${todays}   →  no profit`;
      line = `Day ${i + 1}. Selling at ${p} would lose money, so there's nothing to take.`;
    }
    t.say(line);
    t.beat(label, beatsFor);

    // the minimum check is its own decision, so it gets its own arithmetic
    if (p < cheapest) {
      const was = cheapest;
      cheapest = p;
      b.level(cheapest, `cheapest ${cheapest}`);
      b.highlight([i], "match");
      v.set("cheapest", cheapest);
      t.say(`And ${p} is less than ${was}, so let's update cheapest to ${p}. The line drops.`);
      t.beat(`${p}  <  ${was}   →  cheapest = ${p}`, 5);
    }

    // the idea, named once, right after it first pays off
    if (i === 2) {
      t.callout("Two checks a day. That's the whole loop.", "insight");
      t.aside("One number, zero regrets.");
      t.say("And that's the loop. Every day we ask those two questions and nothing else.");
      t.beat("Sell today? · New cheapest?", 6);
    }
  }

  b.clear(); b.drop("day"); b.gapClear();
  b.highlight([1], "match"); b.highlight([4], "match");
  b.gap(4, "+5");
  t.say("Buy day two, sell day five. Five, in one pass.");
  t.result(best, "Max profit");
  t.beat("", 6);

  /* ── the code, once, at the end ─────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", undefined, ["That's the whole algorithm."], "big");
  t.scene("complexity", { show: ["ctext", "code"] });
  t.say("The code is two questions a day.");
  t.line(5);
  t.beat("Could I sell today for more?", 6);
  t.say("Could I sell today for more? And is today the new cheapest?");
  t.line(6);
  t.beat("Is today the new cheapest?", 6);
  t.say("One pass. Two numbers.");
  t.line();
  t.beat("One pass · O(n) time · O(1) space", 7);

  /* ── outro ──────────────────────────────────────────── */
  t.text("otext", undefined, ["You don't need the whole past.", "Just the best bit of it."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.say("That's it, under 100 seconds. See ya.");
  t.beat("", 8);
}
