import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

/**
 * SCRIPT-FIRST. Every t.say() below is a verbatim line from narration/move-zeroes.txt,
 * in order. This trace chooses only what appears on screen — never the words.
 * `npm run traces` fails if any line is reworded, reordered, added or dropped.
 */
export const meta: MetaInput = {
  slug: "move-zeroes", number: 283, title: "Move Zeroes", difficulty: "Easy",
  pattern: "two-pointers", fps: 30, width: 1080, height: 1920,
  framesPerBeat: 12,
  tagline: "before anyone catches them",
};

export function trace(t: Tracer) {
  const N = [0, 1, 0, 3, 12];

  /* 1 */
  t.scene("hook", { transition: "cut" });
  t.say("Let's move zeros under 100 seconds.");
  t.beat("All zeros to the right", 5);

  /* 2-3 */
  const pn = t.array("pn", N, { label: "nums" });
  t.scene("problem", { show: ["pn"] });
  t.say("Given an array, all you have to do is move all the zeros to the right and non zeros to the left, without changing the order of the non zeros.");
  pn.highlight([0, 2], "bad");
  pn.highlight([1, 3, 4], "match");
  t.beat("zeros right · non-zeros left · order kept", 6);
  pn.clear();
  t.say("Let's consider an array.");
  t.beat("nums = [0, 1, 0, 3, 12]", 4);

  /* 4-16 */
  const a = t.array("a", N, { label: "nums" });
  const v = t.vars("v");
  t.scene("walkthrough", { show: ["a", "v"] });

  t.say("We'll use the two pointers approach.");
  t.beat("Two pointers", 4);

  let red = 0, green = 0;
  a.pointer("red", red, "danger");
  a.highlight([red], "bad");
  t.say("The red pointer loves zeros, so it always points to the first zero.");
  t.beat("red → the first zero", 6);

  a.pointer("green", green, "success");
  t.say("The green pointer keeps moving ahead, searching for non zero numbers and throwing them at red.");
  t.beat("green → hunts non-zeros", 6);

  v.setAll({ red, green });
  t.say("Initially both red and green are at index 0.");
  t.beat("red = 0 · green = 0", 5);

  t.say("Red is happy sitting on a 0.");
  t.beat("nums[0] = 0 · red stays", 4);

  // green walks to the first non-zero
  green = 1;
  a.move("green", green);
  a.highlight([green], "compare");
  v.set("green", green);
  t.say("Green moves forward to find a non zero.");
  t.beat("green = 1 · nums[1] = 1", 5);

  a.swap(red, green);
  a.highlight([red], "match");
  t.say("When green finds one, it throws it at red and the numbers swap.");
  t.beat("swap(0, 1)  →  [1, 0, 0, 3, 12]", 6);

  red = 1;
  a.move("red", red);
  a.clear(); a.highlight([red], "bad");
  v.set("red", red);
  t.say("Because red loves zero, it moves one step forward, looking for another 0, now pointing to the next zero position.");
  t.beat("red = 1 · back on a zero", 7);

  green = 2;
  a.move("green", green);
  a.highlight([green], "dim");
  v.set("green", green);
  t.say("Green keeps moving. Skips over zeros because they don't help.");
  t.beat("nums[2] = 0 · skip", 5);

  green = 3;
  a.move("green", green);
  a.clear(); a.highlight([red], "bad"); a.highlight([green], "compare");
  v.set("green", green);
  t.say("When it finds three, it throws it at red again.");
  t.beat("green = 3 · nums[3] = 3", 5);

  a.swap(red, green);
  a.highlight([red], "match");
  red = 2;
  a.move("red", red);
  v.setAll({ red, green });
  t.say("They swap and red moves ahead once more.");
  t.beat("swap(1, 3)  →  [1, 3, 0, 0, 12]", 6);

  green = 4;
  a.move("green", green);
  a.clear(); a.highlight([red], "bad"); a.highlight([green], "compare");
  a.swap(red, green);
  a.highlight([red], "match");
  red = 3;
  a.move("red", red);
  v.setAll({ red, green });
  t.say("Green continues, finds 12, throws it at red, numbers swap and red advances again.");
  t.beat("swap(2, 4)  →  [1, 3, 12, 0, 0]", 7);

  a.clear(); a.drop("red"); a.drop("green");
  a.highlight([0, 1, 2], "match");
  a.highlight([3, 4], "done");
  t.say("If you look at it now, all non zero elements are packed to the left, all zeros are pushed to the right.");
  t.beat("[1, 3, 12, 0, 0]", 7);

  /* 17 */
  t.text("otext", undefined, ["All done in one pass."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.say("All done in one pass. That's LeetCode under 100 seconds.");
  t.beat("", 6);
}
