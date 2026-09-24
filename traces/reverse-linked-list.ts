import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "reverse-linked-list", number: 206, title: "Reverse Linked List", difficulty: "Easy",
  pattern: "linked-list", fps: 30, width: 1080, height: 1920, framesPerBeat: 10,
};

const SRC = `def reverseList(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev`;

export function trace(t: Tracer) {
  const VALUES = [1, 2, 3, 4];

  t.scene("hook", { transition: "cut" });
  t.beat("Three pointers. One pass. Reversed.", 5);

  const pl = t.list("pl", VALUES, { label: "head" });
  t.text("ptext", undefined, ["Flip every arrow", "without moving a node."], "big");
  t.scene("problem", { show: ["ptext", "pl"] });
  t.beat("Input: 1 → 2 → 3 → 4", 4);
  pl.mark("pln0", "compare"); pl.mark("pln3", "match");
  t.beat("Output: 4 → 3 → 2 → 1", 5);

  t.text("btext", "The tempting way", [
    "Copy every value into an array.",
    "Write them back in reverse.",
  ], "bullets");
  t.scene("brute", { show: ["btext"] });
  t.beat("Naive: copy to array, rebuild", 4);
  t.callout("Works — but it's O(n) extra memory", "warn");
  t.aside("An entire array, to flip three arrows.");
  t.beat("Target: O(1) extra space", 4);

  t.text("itext", "The catch", [
    "Overwrite cur.next and you lose the rest of the list.",
    "So save it first.",
  ], "big");
  t.scene("insight", { show: ["itext"] });
  t.beat("Overwriting cur.next loses the tail", 5);
  t.formula("nxt = cur.next   before   cur.next = prev");
  t.beat("Save nxt before rewriting cur.next", 5);

  const l = t.list("l", VALUES, { label: "list" });
  const v = t.vars("v");
  t.code("code", SRC, "python");
  t.scene("walkthrough", { show: ["l", "v", "code"] });

  const id = (i: number) => `ln${i}`;
  let prev: string | null = null;
  let cur: string | null = id(0);
  v.setAll({ prev: "None", cur: 1 });
  t.line(2, 3);
  t.beat("prev = None,  cur = head", 3);

  let guard = 0;
  while (cur && guard++ < 10) {
    l.mark(cur, "active");
    if (prev) l.mark(prev, "done");
    t.line(4, 5);
    const nxt: string | null = l.next(cur);
    v.setAll({ prev: prev ? String(l.value(prev)) : "None", cur: String(l.value(cur)), nxt: nxt ? String(l.value(nxt)) : "None" });
    t.beat(`nxt = ${nxt ? l.value(nxt) : "None"}`, 2);

    l.relink(cur, prev);
    t.line(6);
    t.beat("cur.next = prev", 2);

    prev = cur; cur = nxt;
    v.setAll({ prev: String(l.value(prev)), cur: cur ? String(l.value(cur)) : "None" });
    t.line(7, 8);
    t.beat("prev = cur,  cur = nxt", 2);
  }

  if (prev) { l.mark(prev, "match"); l.setHead(prev); }
  t.line(9);
  t.result([4, 3, 2, 1], "New head");
  t.beat("cur = None  →  prev is the new head", 4);

  t.text("ctext", "Why it's fast", [
    "Every node is touched exactly once → O(n)",
    "Only three pointers are ever stored → O(1) space",
  ], "bullets");
  t.scene("complexity", { show: ["ctext"] });
  t.beat("O(n) time  ·  O(1) space", 4);

  t.text("otext", undefined, ["Save the bridge", "before you burn it."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.aside("Three pointers. Zero regrets.");
  t.beat("", 5);
}
