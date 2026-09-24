import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "invert-binary-tree", number: 226, title: "Invert Binary Tree", difficulty: "Easy",
  pattern: "tree-dfs", fps: 30, width: 1080, height: 1920, framesPerBeat: 10,
};

const SRC = `def invertTree(root):
    if not root:
        return None
    root.left, root.right = root.right, root.left
    invertTree(root.left)
    invertTree(root.right)
    return root`;

/** 4 / (2,7) / (1,3,6,9) */
const NODES = [
  { id: "a", value: 4, left: "b", right: "c" },
  { id: "b", value: 2, left: "d", right: "e" },
  { id: "c", value: 7, left: "f", right: "g" },
  { id: "d", value: 1 }, { id: "e", value: 3 },
  { id: "f", value: 6 }, { id: "g", value: 9 },
];

export function trace(t: Tracer) {
  t.scene("hook", { transition: "cut" });
  t.beat("Mirror a tree in four lines.", 5);

  t.tree("pt", NODES, "a", { label: "root" });
  t.text("ptext", undefined, ["Swap every left and right.", "Top to bottom."], "big");
  t.scene("problem", { show: ["ptext", "pt"] });
  t.beat("Input: swap every left/right pair", 5);

  t.text("btext", "One swap isn't enough", [
    "Swapping only the root's children leaves the grandchildren wrong.",
    "Every node has to swap.",
  ], "bullets");
  t.scene("brute", { show: ["btext"] });
  t.aside("Famously asked. Famously four lines.");
  t.beat("One swap at the root is not enough", 5);

  t.text("itext", "Same job, smaller tree", [
    "Swap this node's children.",
    "Then ask the same question of each child.",
  ], "big");
  t.scene("insight", { show: ["itext"] });
  t.beat("Swap children, then recurse on each", 5);
  t.callout("Every subtree is the same problem", "insight");
  t.beat("", 4);

  const tree = t.tree("tr", NODES, "a", { label: "root" });
  const v = t.vars("v");
  t.code("code", SRC, "python");
  t.scene("walkthrough", { show: ["tr", "v", "code"] });

  // real recursion — the op log is simply its call order
  const kids: Record<string, [string | undefined, string | undefined]> = {};
  for (const n of NODES) kids[n.id] = [n.left, n.right];
  let swaps = 0;
  v.set("swaps", 0);
  t.line(1, 2);
  t.beat("invert(root)", 3);

  (function invert(id: string | undefined, depth: number) {
    if (!id) return;
    tree.visit(id);
    t.line(3);
    t.beat(`visit ${tree.value(id)}`, depth === 0 ? 2 : 1);

    const [L, Rt] = kids[id];
    if (L || Rt) {
      kids[id] = [Rt, L];
      tree.swapChildren(id);
      swaps++; v.set("swaps", swaps);
      t.line(4);
      t.beat(`swap children of ${tree.value(id)}`, 2);
    }
    tree.mark(id, "done");
    t.line(5, 6);
    invert(kids[id][0], depth + 1);
    invert(kids[id][1], depth + 1);
  })("a", 0);

  t.line(7);
  t.result([4, 7, 2, 9, 6, 3, 1]);
  t.beat("every node swapped", 4);

  t.text("ctext", "Why it's fast", [
    "Each node is visited exactly once → O(n)",
    "The call stack is as deep as the tree → O(h) space",
  ], "bullets");
  t.scene("complexity", { show: ["ctext"] });
  t.beat("O(n) time  ·  O(h) space", 4);

  t.text("otext", undefined, ["Solve the node.", "Trust the recursion."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.beat("", 5);
}
