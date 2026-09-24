import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "longest-substring", number: 3, title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium", pattern: "sliding-window", fps: 30, width: 1080, height: 1920, framesPerBeat: 10,
};

const SRC = `def lengthOfLongestSubstring(s):
    last = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best`;

export function trace(t: Tracer) {
  const S = "abcabcbb";

  t.scene("hook", { transition: "cut" });
  t.beat("A window that never repeats itself.", 5);

  const ps = t.string("ps", S, { label: "s" });
  t.text("ptext", undefined, ["Longest stretch with", "no repeated character."], "big");
  t.scene("problem", { show: ["ptext", "ps"] });
  t.beat("Input: s = \"abcabcbb\"", 5);
  ps.window(0, 2, "abc — length 3");
  ps.highlight([0, 1, 2], "window");
  t.beat("Longest unique run: \"abc\"  →  3", 5);

  const b = t.string("b", S, { label: "s" });
  const bv = t.vars("bv");
  t.scene("brute", { show: ["b", "bv"] });
  bv.set("substrings", 0);
  t.beat("Brute force: every substring", 4);
  let count = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = i; j < Math.min(i + 3, S.length); j++) {
      b.clear(); b.window(i, j); b.highlight(range(i, j), "window");
      bv.set("substrings", ++count);
      t.beat("", 1);
    }
  }
  b.clear(); b.windowClear();
  t.callout("O(n²) substrings, each checked in O(n)", "warn");
  t.aside("Cubic. Your CPU would like a word.");
  t.beat("O(n²) substrings × O(n) check  →  O(n³)", 5);

  t.text("itext", "Never look back", [
    "The window only ever grows to the right.",
    "On a repeat, jump left past the old copy.",
  ], "big");
  t.scene("insight", { show: ["itext"] });
  t.beat("Both pointers only move right", 4);
  t.formula("left = last[ch] + 1");
  t.beat("Each index visited at most twice", 5);

  const s = t.string("s", S, { label: "s" });
  const last = t.map("last", { label: "last seen index" });
  const v = t.vars("v");
  t.code("code", SRC, "python");
  t.scene("walkthrough", { show: ["s", ["last", "v"], "code"] });

  let left = 0, best = 0;
  v.setAll({ left: 0, best: 0 });
  s.pointer("L", 0, "secondary");
  s.pointer("R", 0, "primary");
  t.line(2, 3);
  t.beat("left = 0,  best = 0,  last = {}", 3);

  for (let right = 0; right < S.length; right++) {
    const ch = S[right];
    s.move("R", right);
    s.clear(); s.highlight([right], "active");
    t.line(4);
    t.beat(`right = ${right},  ch = '${ch}'`, 2);

    t.line(5);
    const seenAt = last.has(ch) ? (last.peek(ch) as number) : -1;
    if (seenAt >= left) {
      left = seenAt + 1;
      s.move("L", left);
      t.line(6);
      t.beat(`'${ch}' seen at ${seenAt}  →  left = ${left}`, 3);
    } else {
      t.beat(`'${ch}' not in window`, 2);
    }

    last.put(ch, right);
    const len = right - left + 1;
    s.window(left, right, `len ${len}`);
    s.highlight(range(left, right), "window");
    s.highlight([right], "active");
    best = Math.max(best, len);
    v.setAll({ left, best });
    t.line(7, 8);
    t.beat(`window = ${len},  best = ${best}`, 2);
  }

  s.drop("L"); s.drop("R"); s.windowClear();
  t.result(best);
  t.beat("", 4);

  t.text("ctext", "Why it's fast", [
    "Each pointer crosses the string once → O(n)",
    "The map holds one entry per distinct character → O(k)",
    "Cubic becomes linear.",
  ], "bullets");
  t.scene("complexity", { show: ["ctext"] });
  t.beat("", 4);
  t.beat("O(n) time  ·  O(k) space", 4);

  t.text("otext", undefined, ["If both ends only move forward,", "you have a sliding window."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.aside("No backtracking. Very healthy.");
  t.beat("", 5);
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
