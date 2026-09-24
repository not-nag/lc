import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "encode-and-decode-strings", number: 271,
  title: "Encode and Decode Strings", difficulty: "Medium",
  pattern: "length-prefix", tagline: "say how long, then say it",
};

const SRC = `def encode(strs):
    return "".join(f"{len(s)}#{s}" for s in strs)

def decode(s):
    out, i = [], 0
    while i < len(s):
        j = s.index("#", i)
        n = int(s[i:j])
        out.append(s[j + 1 : j + 1 + n])
        i = j + 1 + n
    return out`;

export function trace(t: Tracer) {
  const WORDS = ["neet", "co#de"];
  const ENC = "4#neet5#co#de";

  t.section("hook");
  t.say("Encode and Decode Strings, with no escaping at all.");
  t.slide("One string, back into many");

  const pw = t.array("pw", WORDS, { label: "strs" });
  t.section("problem", { show: ["pw"] });
  t.say("Pack a list of strings into one string, and get the list back.");
  t.slide("list → one string → list");
  t.say("A separator looks obvious, until a string contains it. The second word here holds a hash.");
  pw.highlight([1], "bad");
  t.slide("any separator can appear inside a word");

  /* ── walkthrough ────────────────────────────────────── */
  const e = t.string("e", ENC, { label: "encoded" });
  const v = t.vars("v");
  t.section("walkthrough", { show: ["e", "v"] });

  t.callout("Say how long it is before you say it", "insight");
  t.aside("Length can't be faked by the content.");
  t.say("So don't separate. Announce the length first. Nothing inside a word can lie about how long it is.");
  t.slide("length, then a marker, then the word");

  e.highlight([0], "active");
  e.highlight([1], "compare");
  t.say("Four, then a hash. The next four characters are one whole string.");
  t.slide("4#  →  take 4 characters");

  e.clear();
  e.highlight([0, 1], "compare");
  e.highlight([2, 3, 4, 5], "match");
  e.window(2, 5, "first string");
  v.set("out", "neet");
  t.say("n-e-e-t. Read exactly four and stop.");
  t.slide("\"neet\"");

  e.clear(); e.windowClear();
  e.highlight([6], "active");
  e.highlight([7], "compare");
  t.say("Now five, then a hash.");
  t.slide("5#  →  take 5 characters");

  e.clear();
  e.highlight([6, 7], "compare");
  e.highlight([8, 9, 10, 11, 12], "match");
  e.window(8, 12, "second string");
  v.set("out", "neet, co#de");
  t.say("Five characters, hash included. The hash inside the word never confuses us, because we were told the length before we started reading.");
  t.slide("\"co#de\" — the # inside is just a character");

  e.clear(); e.windowClear();
  e.highlight([2, 3, 4, 5], "match");
  e.highlight([8, 9, 10, 11, 12], "match");
  t.say("Two strings back out, hash and all.");
  t.result(WORDS);
  t.slide();

  /* ── code ───────────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1, 2);
  t.say("Encoding is just length, hash, string, repeated.");
  t.slide();
  t.line(7, 8);
  t.say("Decoding reads up to the hash to learn the length.");
  t.slide();
  t.line(9, 10);
  t.say("Then takes exactly that many characters and jumps past them.");
  t.slide();

  t.text("otext", "Intuition", [
    "A separator can be faked.",
    "A length cannot.",
    "So say how long it is, then say it.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("A separator can be faked by the content. A length cannot.");
  t.slide();
}
