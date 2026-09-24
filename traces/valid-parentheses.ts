import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "valid-parentheses", number: 20, title: "Valid Parentheses", difficulty: "Easy",
  pattern: "stack", fps: 30, width: 1080, height: 1920, framesPerBeat: 10,
};

const SRC = `def isValid(s):
    pairs = {')':'(', ']':'[', '}':'{'}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack`;

export function trace(t: Tracer) {
  const S = "([{}])";
  const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  t.scene("hook", { transition: "cut" });
  t.beat("Brackets only close in reverse order.", 5);

  const ps = t.string("ps", S, { label: "s" });
  t.text("ptext", undefined, ["Is every bracket closed", "in the right order?"], "big");
  t.scene("problem", { show: ["ptext", "ps"] });
  t.beat("Input: s = \"([{}])\"", 4);
  ps.highlight([0, 5], "compare");
  t.beat("First opened = last closed", 5);
  ps.clear(); ps.highlight([2, 3], "match");
  t.beat("Innermost pair closes first", 4);

  t.text("btext", "Why counting fails", [
    "\"([)]\" has equal counts of each bracket.",
    "It is still invalid — the order is wrong.",
  ], "bullets");
  t.scene("brute", { show: ["btext"] });
  t.beat("Counting brackets is not enough", 4);
  t.callout("Order matters, not totals", "warn");
  t.aside("This is how you ship a broken parser.");
  t.beat("Order matters, not totals", 4);

  t.text("itext", "Last in, first out", [
    "Push every opening bracket.",
    "A closing bracket must match the top.",
  ], "big");
  t.scene("insight", { show: ["itext"] });
  t.beat("Last in, first out  →  stack", 4);
  t.callout("A stack remembers the order for free", "insight");
  t.beat("", 4);

  const s = t.string("s", S, { label: "s" });
  const st = t.stack("st", { label: "stack" });
  const v = t.vars("v");
  t.code("code", SRC, "python");
  t.scene("walkthrough", { show: ["s", ["st", "v"], "code"] });
  v.set("stack size", 0);
  t.line(2, 3);
  t.beat("stack = []  ·  scan left to right", 3);

  let valid = true;
  for (let i = 0; i < S.length; i++) {
    s.clear();
    if (i === 0) s.pointer("ch", i, "primary"); else s.move("ch", i);
    const ch = s.read(i, "active") as string;
    t.line(4);

    if (PAIRS[ch]) {
      t.line(5, 6);
      const top = st.top();
      st.peek();
      t.beat(`${ch} expects ${PAIRS[ch]} on top`, 2);
      if (st.isEmpty || top !== PAIRS[ch]) {
        s.highlight([i], "bad"); valid = false;
        t.beat("top ≠ expected  →  invalid", 3);
        break;
      }
      st.pop();
      s.highlight([i], "match");
      v.set("stack size", st.length);
      t.beat(`top = ${top}  ✓  pop`, 2);
    } else {
      t.line(8, 9);
      st.push(ch);
      v.set("stack size", st.length);
      t.beat(`push ${ch}`, 2);
    }
  }

  t.line(10);
  s.clear(); s.drop("ch");
  t.result(valid && st.isEmpty);
  t.beat("stack empty  →  valid", 4);

  t.text("ctext", "Why it's fast", [
    "Each character is pushed and popped at most once → O(n)",
    "The stack holds at most n brackets → O(n) space",
  ], "bullets");
  t.scene("complexity", { show: ["ctext"] });
  t.beat("O(n) time  ·  O(n) space", 4);

  t.text("otext", undefined, ["The stack IS the memory", "of what's still open."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.aside("A stack holds grudges, in order.");
  t.beat("", 5);
}
