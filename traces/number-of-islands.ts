import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "number-of-islands", number: 200, title: "Number of Islands", difficulty: "Medium",
  pattern: "grid", fps: 30, width: 1080, height: 1920, framesPerBeat: 10,
};

const SRC = `def numIslands(grid):
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                count += 1
                sink(r, c)
    return count

def sink(r, c):
    if out_of_bounds or grid[r][c] == '0':
        return
    grid[r][c] = '0'
    for dr, dc in DIRS:
        sink(r + dr, c + dc)`;

export function trace(t: Tracer) {
  const G = [
    [1, 1, 0, 0],
    [1, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 0, 0, 1],
  ];
  const R = G.length, C = G[0].length;

  t.scene("hook", { transition: "cut" });
  t.beat("Count the islands. Sink them as you go.", 5);

  const pg = t.grid("pg", G, { label: "grid" });
  t.text("ptext", undefined, ["1 is land, 0 is water.", "How many connected islands?"], "big");
  t.scene("problem", { show: ["ptext", "pg"] });
  t.beat("Input: grid of 1 = land, 0 = water", 5);
  pg.paint([[0, 0], [0, 1], [1, 0]], "match");
  t.beat("Island A: 3 connected cells", 4);
  pg.paint([[1, 3], [2, 2], [2, 3], [3, 3]], "window");
  t.beat("Island B: 4 connected cells", 4);

  t.text("btext", "The hard part", [
    "Finding land is easy.",
    "Not counting the same island twice is the problem.",
  ], "bullets");
  t.scene("brute", { show: ["btext"] });
  t.beat("Naive count = every land cell", 5);
  t.callout("We need to erase an island once we've counted it", "warn");
  t.aside("Destroying evidence, but legally.");
  t.beat("", 4);

  t.text("itext", "Sink what you count", [
    "Find any land cell → that's a new island.",
    "Flood it to water so it can't be found again.",
  ], "big");
  t.scene("insight", { show: ["itext"] });
  t.beat("Count once, then sink the island", 5);
  t.callout("Every cell is visited a constant number of times", "insight");
  t.beat("", 4);

  const g = t.grid("g", G, { label: "grid" });
  const st = t.stack("st", { label: "to sink" });
  const v = t.vars("v");
  t.code("code", SRC, "python");
  t.scene("walkthrough", { show: [["g", "st"], "v", "code"] });

  let count = 0;
  v.set("islands", 0);
  t.line(2);
  t.beat("count = 0  ·  scan row by row", 3);

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      g.cursor(r, c);
      if (g.at(r, c) !== 1) continue;

      count++;
      v.set("islands", count);
      g.paint([[r, c]], "match");
      t.line(5, 6);
      t.beat(`grid[${r}][${c}] = 1  →  count = ${count}`, 3);

      // iterative flood fill, driven by the real stack handle
      st.push(`${r},${c}`);
      t.line(11, 12);
      t.beat("flood fill from this cell", 2);

      while (!st.isEmpty) {
        const [cr, cc] = String(st.pop()).split(",").map(Number);
        if (cr < 0 || cr >= R || cc < 0 || cc >= C || g.at(cr, cc) !== 1) continue;
        g.set(cr, cc, 0);
        g.paint([[cr, cc]], "done");
        g.cursor(cr, cc);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) st.push(`${cr + dr},${cc + dc}`);
        t.line(13, 14, 15);
        t.beat("", 1);
      }
      t.beat("island sunk to 0", 2);
    }
  }

  g.dropCursor();
  t.line(7);
  t.result(count);
  t.beat("", 4);

  t.text("ctext", "Why it's fast", [
    "Every cell is scanned once and sunk at most once → O(rows × cols)",
    "The stack holds at most the whole grid → O(rows × cols) space",
  ], "bullets");
  t.scene("complexity", { show: ["ctext"] });
  t.beat("O(rows × cols) time and space", 4);

  t.text("otext", undefined, ["Mutating the input", "is the memo."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.beat("", 5);
}
