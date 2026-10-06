import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "best-time-to-buy-and-sell-stock", number: 121,
  title: "Best Time to Buy and Sell Stock", difficulty: "Easy",
  pattern: "sliding-window", tagline: "buy low, sell high, scroll on",
};

const SRC = `cheapest = prices[0]
best     = 0

for price in prices:
    best     = max(best, price - cheapest)
    cheapest = min(cheapest, price)`;

export function trace(t: Tracer) {
  const P = [7, 1, 5, 3, 6, 4];

  t.section("hook");
  t.say("Best Time to Buy and Sell Stock.");
  t.slide("Buy once. Sell later.");

  const pb = t.bars("pb", P, { label: "price by day" });
  t.section("problem", { show: ["pb"] });
  t.say("A week of prices. Each bar is one day.");
  t.slide("six days of prices");
  t.say("One buy, one sell, and the buy has to come first. What is the most you can make?");
  t.slide("buy one day, sell a later one");

  const b = t.bars("b", P, { label: "price by day" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["b", "v"] });

  let cheapest = P[0], best = 0;
  b.highlight([0], "active");
  b.level(cheapest, `cheapest ${cheapest}`);
  v.setAll({ cheapest, best });
  t.say("We carry two things: the cheapest price seen so far, and the best profit so far.");
  t.slide("carry: cheapest, and best");

  for (let i = 1; i < P.length; i++) {
    const p = P[i];
    const todays = p - cheapest;

    b.clear();
    b.highlight([i], "active");
    b.gapClear();

    if (todays > best) {
      const was = best;
      best = todays;
      b.gap(i, `+${todays}`);
      v.set("best", best);
      t.say(`Day ${i + 1}. Sell today and ${p} minus ${cheapest} is ${todays}, which beats ${was}.`);
      t.slide(`${p} − ${cheapest} = ${todays}  >  ${was}`);
    } else if (todays > 0) {
      b.gap(i, `+${todays}`);
      t.say(`Day ${i + 1}. Only ${todays} today, so ${best} stands.`);
      t.slide(`${p} − ${cheapest} = ${todays}  <  ${best}`);
    } else {
      t.say(`Day ${i + 1}. Selling at ${p} would lose money.`);
      t.slide(`${p} − ${cheapest} = ${todays}  →  no profit`);
    }

    if (p < cheapest) {
      const was = cheapest;
      cheapest = p;
      b.level(cheapest, `cheapest ${cheapest}`);
      b.highlight([i], "match");
      v.set("cheapest", cheapest);
      t.say(`And ${p} is less than ${was}, so the line drops to meet it.`);
      t.slide(`${p}  <  ${was}  →  cheapest = ${p}`);

      if (i === 1) {
        t.callout("The line only ever drops", "insight");
        t.aside("One number, zero regrets.");
        t.say("That green line never goes back up. It is the only history we keep, and it is why one pass is enough.");
        t.slide("never look back — just track the minimum");
      }
    }
  }

  b.clear(); b.gapClear();
  b.highlight([1], "match"); b.highlight([4], "match");
  b.gap(4, "+5");
  t.say("Buy on day two, sell on day five. Five, in one pass.");
  t.result(best, "Max profit");
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1, 2);
  t.say("Two numbers to remember.");
  t.slide();
  t.line(5);
  t.say("Could I sell today for more?");
  t.slide();
  t.line(6);
  t.say("Is today the new cheapest?");
  t.slide();

  t.text("otext", "Intuition", [
    "Remember the cheapest day so far.",
    "Then every later day",
    "only has to ask one question:",
    "Could I sell today for more?",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Remember the cheapest day so far. Every later day only has to ask: could I sell today for more?");
  t.slide();
}
