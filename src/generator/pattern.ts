/** Topic tags → our pattern id, used to pick the closest few-shot example. */
const RULES: [RegExp, string][] = [
  [/hash table/i, "hashmap-one-pass"],
  [/two pointers/i, "two-pointers"],
  [/sliding window/i, "sliding-window"],
  [/binary search/i, "binary-search"],
  [/monotonic stack/i, "monotonic-stack"],
  [/^stack$/i, "stack"],
  [/breadth-first/i, "bfs"],
  [/depth-first/i, "dfs"],
  [/topological/i, "topological-sort"],
  [/backtracking/i, "backtracking"],
  [/dynamic programming/i, "dp"],
  [/heap|priority queue/i, "heap"],
  [/union find/i, "union-find"],
  [/linked list/i, "linked-list"],
  [/prefix sum/i, "prefix-sum"],
  [/matrix/i, "grid"],
  [/tree|binary tree/i, "tree-dfs"],
  [/graph/i, "graph"],
  [/sorting/i, "sorting"],
];

export function patternFor(topics: string[]): string {
  for (const [re, id] of RULES) for (const t of topics) if (re.test(t)) return id;
  return "generic";
}
