import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "valid-sudoku", number: 36, title: "Valid Sudoku", difficulty: "Medium",
  pattern: "hash-set", tagline: "three questions per square",
};

const SRC = `rows, cols, boxes = defaultdict(set), defaultdict(set), defaultdict(set)

for r in range(9):
    for c in range(9):
        v = board[r][c]
        if v == ".": continue
        b = (r // 3, c // 3)
        if v in rows[r] or v in cols[c] or v in boxes[b]:
            return False
        rows[r].add(v); cols[c].add(v); boxes[b].add(v)

return True`;

/** A board with a duplicate 5 in the top-left box, so the check actually fires. */
const BOARD = [
  [5, 3, ".", ".", 7, ".", ".", ".", "."],
  [6, ".", ".", 1, 9, 5, ".", ".", "."],
  [".", 9, 8, ".", ".", ".", ".", 6, "."],
  [8, ".", ".", ".", 6, ".", ".", ".", 3],
  [4, ".", ".", 8, ".", 3, ".", ".", 1],
  [7, ".", ".", ".", 2, ".", ".", ".", 6],
  [".", 6, ".", ".", ".", ".", 2, 8, "."],
  [".", ".", ".", 4, 1, 9, ".", ".", 5],
  [".", ".", ".", ".", 8, ".", ".", 7, 9],
];

export function trace(t: Tracer) {
  t.section("hook");
  t.say("Valid Sudoku, in one pass over the board.");
  t.slide("Three rules, one sweep");

  const pb = t.grid("pb", BOARD, { label: "board" });
  t.section("problem", { show: ["pb"] });
  t.say("A board is valid when no digit repeats in any row, any column, or any three by three box.");
  t.slide("no repeats in a row, column, or box");
  t.say("We only check what is filled in. Empty squares are ignored.");
  t.slide("dots are ignored");

  /* ── walkthrough ────────────────────────────────────── */
  const g = t.grid("g", BOARD, { label: "board" });
  const s = t.map("s", { label: "seen so far" });
  // a 9x9 needs every pixel of height, so the set sits beside it, not below
  t.section("walkthrough", { show: [["g", "s"]] });

  t.callout("Every filled square belongs to exactly one of each", "insight");
  t.say("Every square sits in exactly one row, one column, and one box. So each digit only has to be checked three times.");
  t.slide("one row · one column · one box");

  const show = [
    { r: 0, c: 0, v: 5 },
    { r: 0, c: 1, v: 3 },
    { r: 1, c: 3, v: 1 },
  ];

  for (let k = 0; k < show.length; k++) {
    const { r, c, v } = show[k];
    const box = `${Math.floor(r / 3)},${Math.floor(c / 3)}`;

    g.paint(BOARD.map((_, i) => [i, c] as [number, number]), "dim");
    g.paint(BOARD[r].map((_, j) => [r, j] as [number, number]), "dim");
    g.cursor(r, c);
    g.paint([[r, c]], "active");
    t.say(`The ${v} at row ${r}, column ${c}.`);
    t.slide(`board[${r}][${c}] = ${v}`);

    const boxCells: [number, number][] = [];
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) boxCells.push([i, j]);
    g.paint(boxCells, "compare");
    g.paint([[r, c]], "active");
    t.say(`Its box is this three by three block.`);
    t.slide(`box (${box})`);

    s.put(`row ${r}`, v);
    s.put(`col ${c}`, v);
    s.put(`box ${box}`, v);
    t.say(`It is new in all three, so record it in all three and move on.`);
    t.slide(`new in row, column and box  →  keep it`);

    if (k === 0) {
      t.aside("Three sets, one sweep.");
      t.say("If it had already been in any one of them, the board would be invalid and we could stop immediately.");
      t.slide("any repeat  →  invalid, stop");
    }
  }

  g.paint(BOARD.flatMap((row, i) => row.map((_, j) => [i, j] as [number, number])), "idle");
  g.dropCursor();
  t.say("Nothing repeated anywhere, so the board is valid.");
  t.result(true, "Valid");
  t.slide();

  /* ── code ───────────────────────────────────────────── */
  t.code("code", SRC, "python");
  t.text("ctext", "Code", [], "plain");
  t.section("code", { show: ["ctext", "code"] });
  t.line(1);
  t.say("One set per row, per column, and per box.");
  t.slide();
  t.line(7);
  t.say("The box is just the coordinates divided by three.");
  t.slide();
  t.line(8, 9);
  t.say("Seen in any of the three, and the board is invalid.");
  t.slide();

  t.text("otext", "Intuition", [
    "Every square belongs to",
    "one row, one column, one box.",
    "So ask three questions and move on.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("Every square belongs to one row, one column and one box, so ask three questions and move on.");
  t.slide();
}
