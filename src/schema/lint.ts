import type { Storyboard } from "./storyboard";
import type { ViewDecl } from "./views";

export type LintIssue = { level: "error" | "warn"; where: string; message: string };

/**
 * Semantic checks zod cannot express: do referenced views exist, are indices in
 * range, is a pointer moved before it was set, does the runtime fit the budget.
 * Errors here are fed straight back to the model as repair instructions.
 */
export function lint(sb: Storyboard, opts: { maxSeconds?: number } = {}): LintIssue[] {
  const out: LintIssue[] = [];
  const maxSeconds = opts.maxSeconds ?? 100;
  const views = new Map<string, ViewDecl>(sb.views.map((v) => [v.id, v]));

  if (new Set(sb.views.map((v) => v.id)).size !== sb.views.length)
    out.push({ level: "error", where: "views", message: "duplicate view id" });

  // running length of each array-like so index checks follow push/pop
  const len = new Map<string, number>();
  for (const v of sb.views) {
    if (v.kind === "array") len.set(v.id, v.values.length);
    if (v.kind === "string") len.set(v.id, v.value.length);
    if (v.kind === "stack" || v.kind === "queue") len.set(v.id, v.values.length);
  }
  const pointers = new Set<string>();
  const nodeIds = new Map<string, Set<string>>();
  for (const v of sb.views) {
    if (v.kind === "list" || v.kind === "tree") nodeIds.set(v.id, new Set(v.nodes.map((n) => n.id)));
    if (v.kind === "graph") nodeIds.set(v.id, new Set(v.nodes.map((n) => n.id)));
  }

  let frames = 0;
  const CPS = 19;
  const readable = (c: string | undefined) =>
    c ? Math.round(Math.min(2.4, Math.max(0.7, c.length / CPS + 0.25)) * sb.meta.fps) : 0;
  sb.scenes.forEach((sc, si) => {
    const paneViews = new Set(sc.layout.map((p) => p.view));
    for (const p of sc.layout)
      if (!views.has(p.view))
        out.push({ level: "error", where: `scenes[${si}].layout`, message: `pane targets unknown view "${p.view}"` });

    sc.steps.forEach((st, ti) => {
      const speech = st.voice?.trim()
        ? Math.round(Math.min(8.5, st.voice.trim().split(/\s+/).length / 2.95 + 0.22) * sb.meta.fps) : 0;
      frames += Math.max(Math.max(1, Math.round(st.beats * sb.meta.framesPerBeat)),
                         Math.max(readable(st.label), speech));
      const at = `scenes[${si}](${sc.id}).steps[${ti}]`;
      for (const op of st.ops) {
        const vid = (op as any).view as string | undefined;
        if (vid && !views.has(vid)) {
          out.push({ level: "error", where: at, message: `op "${op.type}" targets unknown view "${vid}"` });
          continue;
        }
        if (vid && !paneViews.has(vid))
          out.push({ level: "warn", where: at, message: `op touches "${vid}" but that view is not in this scene's layout — it will be invisible` });

        const n = vid ? len.get(vid) : undefined;
        const chk = (i: number, field: string) => {
          if (n !== undefined && (i < 0 || i >= n))
            out.push({ level: "error", where: at, message: `${op.type}.${field}=${i} out of range for "${vid}" (length ${n})` });
        };
        switch (op.type) {
          case "array.highlight": (op.indices as number[]).forEach((i) => chk(i, "indices")); break;
          case "array.swap": chk(op.a, "a"); chk(op.b, "b"); break;
          case "array.link": chk(op.a, "a"); chk(op.b, "b"); break;
          case "array.setValue": chk(op.index, "index"); break;
          case "array.window": chk(op.from, "from"); chk(op.to, "to");
            if (op.from > op.to) out.push({ level: "error", where: at, message: `array.window from(${op.from}) > to(${op.to})` });
            break;
          case "array.push": if (vid && n !== undefined) len.set(vid, n + 1); break;
          case "array.pop": case "stack.pop": case "queue.dequeue":
            if (vid && n !== undefined) { if (n === 0) out.push({ level: "error", where: at, message: `${op.type} on empty "${vid}"` }); else len.set(vid, n - 1); }
            break;
          case "stack.push": case "queue.enqueue": if (vid && n !== undefined) len.set(vid, n + 1); break;
          case "pointer.set": pointers.add(`${vid}:${op.name}`); chk(op.index, "index"); break;
          case "pointer.move":
            if (!pointers.has(`${vid}:${op.name}`))
              out.push({ level: "error", where: at, message: `pointer.move "${op.name}" before any pointer.set on "${vid}"` });
            chk(op.index, "index"); break;
          case "pointer.drop": pointers.delete(`${vid}:${op.name}`); break;
          case "grid.paint": case "grid.setValue": case "grid.cursor": {
            const v = vid ? views.get(vid) : undefined;
            if (v?.kind === "grid") {
              const rows = v.cells.length, cols = v.cells[0]?.length ?? 0;
              const pts: [number, number][] = op.type === "grid.paint" ? op.cells : [[op.r, op.c]];
              for (const [r, c] of pts)
                if (r < 0 || r >= rows || c < 0 || c >= cols)
                  out.push({ level: "error", where: at, message: `${op.type} cell (${r},${c}) outside ${rows}x${cols} grid "${vid}"` });
            }
            break;
          }
          case "tree.visit": case "tree.mark": case "tree.setValue":
          case "graph.mark": case "list.mark": case "list.remove": {
            const set = vid ? nodeIds.get(vid) : undefined;
            if (set && !set.has(op.nodeId))
              out.push({ level: "error", where: at, message: `${op.type} unknown node "${op.nodeId}" in "${vid}"` });
            break;
          }
          case "list.insert": if (vid) nodeIds.get(vid)?.add(op.nodeId); break;
          case "graph.edge": {
            const set = vid ? nodeIds.get(vid) : undefined;
            if (set && (!set.has(op.from) || !set.has(op.to)))
              out.push({ level: "error", where: at, message: `graph.edge references unknown node (${op.from}→${op.to})` });
            break;
          }
        }
      }
      if (st.code) {
        const cv = views.get(st.code.view);
        if (!cv) out.push({ level: "error", where: at, message: `code highlight targets unknown view "${st.code.view}"` });
        else if (cv.kind === "code") {
          const total = cv.source.split("\n").length;
          for (const l of st.code.lines)
            if (l < 1 || l > total)
              out.push({ level: "error", where: at, message: `code line ${l} outside 1..${total}` });
        }
      }
    });
  });

  const secs = (frames + sb.scenes.length * 5) / sb.meta.fps;
  if (secs > maxSeconds)
    out.push({ level: "error", where: "meta", message: `runtime ${secs.toFixed(1)}s exceeds the ${maxSeconds}s budget — cut beats` });
  if (secs < 20) out.push({ level: "warn", where: "meta", message: `runtime only ${secs.toFixed(1)}s — probably too thin` });
  if (!sb.scenes.some((s) => s.kind === "walkthrough"))
    out.push({ level: "warn", where: "scenes", message: "no walkthrough scene — the video has no algorithm trace" });

  return out;
}

export const hasErrors = (issues: LintIssue[]) => issues.some((i) => i.level === "error");
export const formatIssues = (issues: LintIssue[]) =>
  issues.map((i) => `[${i.level}] ${i.where}: ${i.message}`).join("\n");
