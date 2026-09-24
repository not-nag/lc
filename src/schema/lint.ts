import type { Deck } from "./deck";
import type { ViewDecl } from "./views";

export type LintIssue = { level: "error" | "warn"; where: string; message: string };

/**
 * Checks zod cannot express: do referenced views exist, are indices in range, is a
 * pointer moved before it was set. No timing checks — a slide has no duration.
 */
export function lint(deck: Deck): LintIssue[] {
  const out: LintIssue[] = [];
  const views = new Map<string, ViewDecl>(deck.views.map((v) => [v.id, v]));
  if (new Set(deck.views.map((v) => v.id)).size !== deck.views.length)
    out.push({ level: "error", where: "views", message: "duplicate view id" });

  const len = new Map<string, number>();
  for (const v of deck.views) {
    if (v.kind === "array" || v.kind === "bars") len.set(v.id, v.values.length);
    if (v.kind === "string") len.set(v.id, v.value.length);
    if (v.kind === "stack" || v.kind === "queue") len.set(v.id, v.values.length);
  }
  const pointers = new Set<string>();
  const nodeIds = new Map<string, Set<string>>();
  for (const v of deck.views)
    if (v.kind === "list" || v.kind === "tree" || v.kind === "graph")
      nodeIds.set(v.id, new Set(v.nodes.map((n: any) => n.id)));

  deck.sections.forEach((sc, si) => {
    const paneViews = new Set(sc.layout.map((p) => p.view));
    for (const p of sc.layout)
      if (!views.has(p.view))
        out.push({ level: "error", where: `sections[${si}].layout`, message: `unknown view "${p.view}"` });

    sc.slides.forEach((sl, ti) => {
      const at = `sections[${si}](${sc.id}).slides[${ti}]`;
      for (const op of sl.ops as any[]) {
        const vid = op.view as string | undefined;
        if (vid && !views.has(vid)) {
          out.push({ level: "error", where: at, message: `op "${op.type}" targets unknown view "${vid}"` });
          continue;
        }
        if (vid && !paneViews.has(vid))
          out.push({ level: "warn", where: at, message: `"${vid}" is not on screen in this section` });

        const n = vid ? len.get(vid) : undefined;
        const chk = (i: number, f: string) => {
          if (n !== undefined && (i < 0 || i >= n))
            out.push({ level: "error", where: at, message: `${op.type}.${f}=${i} out of range for "${vid}" (length ${n})` });
        };
        switch (op.type) {
          case "array.highlight": (op.indices as number[]).forEach((i) => chk(i, "indices")); break;
          case "array.swap": case "array.link": chk(op.a, "a"); chk(op.b, "b"); break;
          case "array.setValue": case "array.tag": chk(op.index, "index"); break;
          case "bars.gap": chk(op.index, "index"); break;
          case "array.window": chk(op.from, "from"); chk(op.to, "to"); break;
          case "array.push": case "stack.push": case "queue.enqueue":
            if (vid && n !== undefined) len.set(vid, n + 1); break;
          case "array.pop": case "stack.pop": case "queue.dequeue":
            if (vid && n !== undefined) { if (n === 0) out.push({ level: "error", where: at, message: `${op.type} on empty "${vid}"` }); else len.set(vid, n - 1); }
            break;
          case "pointer.set": pointers.add(`${vid}:${op.name}`); chk(op.index, "index"); break;
          case "pointer.move":
            if (!pointers.has(`${vid}:${op.name}`))
              out.push({ level: "error", where: at, message: `pointer.move "${op.name}" before any pointer.set` });
            chk(op.index, "index"); break;
          case "pointer.drop": pointers.delete(`${vid}:${op.name}`); break;
          case "grid.paint": case "grid.setValue": case "grid.cursor": {
            const v = vid ? views.get(vid) : undefined;
            if (v?.kind === "grid") {
              const rows = v.cells.length, cols = v.cells[0]?.length ?? 0;
              const pts: [number, number][] = op.type === "grid.paint" ? op.cells : [[op.r, op.c]];
              for (const [r, c] of pts)
                if (r < 0 || r >= rows || c < 0 || c >= cols)
                  out.push({ level: "error", where: at, message: `${op.type} cell (${r},${c}) outside ${rows}x${cols}` });
            }
            break;
          }
          case "tree.visit": case "tree.mark": case "tree.swapChildren":
          case "graph.mark": case "list.mark": case "list.remove": {
            const set = vid ? nodeIds.get(vid) : undefined;
            if (set && !set.has(op.nodeId))
              out.push({ level: "error", where: at, message: `${op.type} unknown node "${op.nodeId}"` });
            break;
          }
        }
      }
      if (sl.code) {
        const cv = views.get(sl.code.view);
        if (!cv) out.push({ level: "error", where: at, message: `code highlight targets unknown view "${sl.code.view}"` });
        else if (cv.kind === "code") {
          const total = cv.source.split("\n").length;
          for (const l of sl.code.lines)
            if (l < 1 || l > total) out.push({ level: "error", where: at, message: `code line ${l} outside 1..${total}` });
        }
      }
    });
  });
  return out;
}

export const hasErrors = (i: LintIssue[]) => i.some((x) => x.level === "error");
export const formatIssues = (i: LintIssue[]) => i.map((x) => `[${x.level}] ${x.where}: ${x.message}`).join("\n");
