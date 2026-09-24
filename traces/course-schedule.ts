import type { Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "course-schedule", number: 207, title: "Course Schedule", difficulty: "Medium",
  pattern: "topological-sort", fps: 30, width: 1080, height: 1920, framesPerBeat: 10,
};

const SRC = `def canFinish(n, prereqs):
    indeg = [0] * n
    graph = defaultdict(list)
    for a, b in prereqs:
        graph[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    done = 0
    while q:
        node = q.popleft()
        done += 1
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return done == n`;

/** 0 → 1 → 3,  0 → 2 → 3 */
const NODES = [
  { id: "0", x: 0, y: 0 }, { id: "1", x: -1, y: 1 },
  { id: "2", x: 1, y: 1 }, { id: "3", x: 0, y: 2 },
];
const EDGES = [
  { from: "0", to: "1", directed: true }, { from: "0", to: "2", directed: true },
  { from: "1", to: "3", directed: true }, { from: "2", to: "3", directed: true },
];

export function trace(t: Tracer) {
  t.scene("hook", { transition: "cut" });
  t.beat("Can you finish every course?", 5);

  t.graph("pg", NODES, EDGES, { label: "prerequisites" });
  t.text("ptext", undefined, ["An arrow means", "\"must come first\"."], "big");
  t.scene("problem", { show: ["ptext", "pg"] });
  t.beat("Input: n courses + prerequisite pairs", 5);
  t.beat("Finishable  ⟺  no cycle", 5);

  t.text("btext", "Why not just walk it?", [
    "Following arrows from one start can miss branches.",
    "And a cycle makes you walk forever.",
  ], "bullets");
  t.scene("brute", { show: ["btext"] });
  t.beat("Naive walk: misses branches, loops forever", 5);
  t.callout("We need to know when a course becomes takeable", "warn");
  t.aside("A cycle means course 3 requires course 3.");
  t.beat("", 4);

  t.text("itext", "Count what's blocking", [
    "Track how many prerequisites each course still has.",
    "Zero means you can take it now.",
  ], "big");
  t.scene("insight", { show: ["itext"] });
  t.beat("indegree = incoming prerequisite count", 4);
  t.formula("indegree == 0  →  takeable");
  t.beat("Take a 0-indegree course, decrement neighbours", 5);

  const g = t.graph("g", NODES, EDGES, { label: "courses" });
  const q = t.queue("q", { label: "takeable now" });
  const v = t.vars("v");
  t.code("code", SRC, "python");
  t.scene("walkthrough", { show: ["g", ["q", "v"], "code"] });

  const N = 4;
  const adj: Record<string, string[]> = { "0": ["1", "2"], "1": ["3"], "2": ["3"], "3": [] };
  const indeg: Record<string, number> = { "0": 0, "1": 1, "2": 1, "3": 2 };

  v.setAll({ taken: 0, "of": N });
  t.line(2, 6);
  t.beat("indegree = [0, 1, 1, 2]", 4);

  for (const id of Object.keys(indeg)) if (indeg[id] === 0) { q.enqueue(id); g.mark(id, "active"); }
  t.line(7);
  t.beat("queue = courses with indegree 0", 3);

  let done = 0;
  let guard = 0;
  while (!q.isEmpty && guard++ < 12) {
    const node = String(q.dequeue());
    done++;
    g.mark(node, "done");
    v.set("taken", done);
    t.line(9, 10, 11);
    t.beat(`pop ${node}  →  taken = ${done}`, 2);

    for (const nxt of adj[node]) {
      g.edge(node, nxt, "visited");
      indeg[nxt]--;
      t.line(12, 13);
      t.beat(`indegree[${nxt}] = ${indeg[nxt]}`, 2);
      if (indeg[nxt] === 0) {
        q.enqueue(nxt);
        g.mark(nxt, "active");
        t.line(14, 15);
        t.beat(`indegree[${nxt}] = 0  →  enqueue`, 2);
      }
    }
  }

  t.line(16);
  t.result(done === N);
  t.beat(`taken = ${N} of ${N}  →  no cycle`, 4);

  t.text("ctext", "Why it's fast", [
    "Each course and each arrow is handled once → O(V + E)",
    "The queue and indegree array hold V entries → O(V) space",
  ], "bullets");
  t.scene("complexity", { show: ["ctext"] });
  t.beat("", 4);

  t.text("otext", undefined, ["If the queue empties early,", "something is waiting on itself."], "big");
  t.scene("outro", { show: ["otext"], transition: "fade" });
  t.beat("", 5);
}
