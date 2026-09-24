import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "valid-palindrome", number: 125, title: "Valid Palindrome", difficulty: "Easy",
  pattern: "two-pointers", tagline: "same forwards, same backwards",
};

const SRC = `l, r = 0, len(s) - 1

while l < r:
    while l < r and not s[l].isalnum(): l += 1
    while l < r and not s[r].isalnum(): r -= 1
    if s[l].lower() != s[r].lower():
        return False
    l, r = l + 1, r - 1

return True`;

export function trace(t: Tracer) {
  const S = "Ra c, e car";   // "racecar" once the junk is dropped

  t.section("hook");
  t.say("Valid Palindrome, without building a second string.");
  t.slide("Reads the same both ways");

  const ps = t.string("ps", S, { label: "s" });
  t.section("problem", { show: ["ps"] });
  t.say("Ignore spaces, punctuation and case. Does it read the same both ways?");
  t.slide("ignore punctuation and case");
  t.say("Cleaning the string first works, but that is a whole extra copy. We can just walk it.");
  t.slide("no cleaned copy needed");

  const a = t.string("a", S, { label: "s" });
  t.section("walkthrough", { show: ["a"] });

  let l = 0, r = S.length - 1;
  a.pointer("l", l, "danger");
  a.pointer("r", r, "success");
  t.say("One finger at each end, walking towards the middle.");
  t.slide("one pointer at each end");

  const alnum = (c: string) => /[a-z0-9]/i.test(c);
  let guard = 0;
  let ok = true;

  while (l < r && guard++ < 14) {
    if (!alnum(S[l])) {
      a.clear();
      a.highlight([l], "dim");
      t.say(`Left is on a ${S[l] === " " ? "space" : "comma"}, which does not count. Step over it.`);
      a.move("l", ++l);
      t.slide(`skip '${S[l - 1] === " " ? "␣" : S[l - 1]}'`);
      continue;
    }
    if (!alnum(S[r])) {
      a.clear();
      a.highlight([r], "dim");
      t.say(`Right is on something that does not count either.`);
      a.move("r", --r);
      t.slide(`skip '${S[r + 1] === " " ? "␣" : S[r + 1]}'`);
      continue;
    }

    a.clear();
    a.highlight([l], "compare");
    a.highlight([r], "compare");
    const same = S[l].toLowerCase() === S[r].toLowerCase();
    t.say(`${S[l]} against ${S[r]}.`);
    t.slide(`'${S[l]}'  vs  '${S[r]}'`);

    if (!same) { ok = false; a.highlight([l, r], "bad"); t.slide("different  →  not a palindrome"); break; }

    a.highlight([l, r], "match");
    t.say("The same, so both fingers step inwards.");
    t.slide(`'${S[l]}' = '${S[r]}'  →  step in`);
    a.move("l", ++l);
    a.move("r", --r);

    if (guard === 3) {
      t.callout("The untested middle only ever shrinks", "insight");
      t.aside("Nothing is ever revisited.");
      t.say("The gap between the fingers only ever narrows. Every character is looked at once, so this is one pass with no extra memory.");
      t.slide("the gap only narrows");
    }
  }

  a.clear(); a.drop("l"); a.drop("r");
  a.highlight([0, 2, 4, 5, 7, 8, 9, 10], "match");
  t.say("The fingers met in the middle with nothing mismatched.");
  t.result(ok, "Palindrome");
  t.slide();

  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(4, 5);
  t.say("Walk each finger past anything that does not count.");
  t.slide();
  t.line(6, 7);
  t.say("Compare what is left, ignoring case.");
  t.slide();
  t.line(8);
  t.say("Match, so step both inwards.");
  t.slide();

  t.text("otext", "Intuition", [
    "A palindrome mirrors around its centre.",
    "So walk in from both ends",
    "and check the pairs.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("A palindrome mirrors around its centre, so walk in from both ends and check the pairs.");
  t.slide();
}
