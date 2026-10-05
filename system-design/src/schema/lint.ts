import type { Deck } from "./deck";
import type { ViewDecl } from "./views";

export type LintIssue = { level: "error" | "warn"; where: string; message: string };

/** Ops that put something new on screen. One change per slide means one of these, maybe two. */
const ADDS = new Set(["arch.node", "arch.insert", "arch.edge", "arch.replicas", "number.set", "compare.row"]);

/**
 * Checks zod cannot express. Two kinds:
 *  - referential: do views, nodes, arrows and keys exist when an op touches them;
 *  - house rules: every component is earned by a bottleneck, the bottleneck carries a
 *    number, it's shown before the fix, one change per slide, no finished diagram up front.
 * No timing checks — a slide has no duration.
 */
export function lint(deck: Deck): LintIssue[] {
  const out: LintIssue[] = [];
  const err = (where: string, message: string) => out.push({ level: "error", where, message });
  const warn = (where: string, message: string) => out.push({ level: "warn", where, message });

  const views = new Map<string, ViewDecl>(deck.views.map((v) => [v.id, v]));
  if (new Set(deck.views.map((v) => v.id)).size !== deck.views.length) err("views", "duplicate view id");

  // live mirrors, advanced op by op
  const nodes = new Map<string, Map<string, number>>();            // view → node → replicas
  const edges = new Map<string, Set<string>>();                    // view → "a>b"
  const tokens = new Map<string, Map<string, number>>();           // view → token → path length
  const keys = new Map<string, Set<string>>();                     // numbers view → keys
  const everAdded = new Map<string, number>();                     // view → nodes ever added
  // house rule state, per architecture view
  const sawBottleneck = new Set<string>();
  const open = new Map<string, boolean>();                         // an unanswered bottleneck
  for (const v of deck.views) {
    if (v.kind === "architecture") { nodes.set(v.id, new Map()); edges.set(v.id, new Set()); tokens.set(v.id, new Map()); }
    if (v.kind === "numbers") keys.set(v.id, new Set());
  }
  for (const sc of deck.sections) for (const sl of sc.slides) for (const op of sl.ops as any[])
    if (op.type === "arch.node" || op.type === "arch.insert") everAdded.set(op.view, (everAdded.get(op.view) ?? 0) + 1);

  const edgeKey = (a: string, b: string) => `${a}>${b}`;
  const hasEdge = (v: string, a: string, b: string) => {
    const s = edges.get(v)!; return s.has(edgeKey(a, b)) || s.has(edgeKey(b, a));
  };
  const dropEdge = (v: string, a: string, b: string) => { const s = edges.get(v)!; s.delete(edgeKey(a, b)); s.delete(edgeKey(b, a)); };

  deck.sections.forEach((sc, si) => {
    const paneViews = new Set(sc.layout.map((p) => p.view));
    for (const p of sc.layout)
      if (!views.has(p.view)) err(`sections[${si}].layout`, `unknown view "${p.view}"`);

    // never show the finished picture before the reasoning
    if (sc.kind === "hook" || sc.kind === "problem" || sc.kind === "estimate")
      for (const p of sc.layout)
        if (views.get(p.view)?.kind === "architecture")
          err(`sections[${si}](${sc.id})`, `a ${sc.kind} section shows the diagram "${p.view}" — it belongs in the walkthrough, built up one box at a time`);

    sc.slides.forEach((sl, ti) => {
      const at = `sections[${si}](${sc.id}).slides[${ti}]`;
      let nodesAdded = 0, adds = 0, bottlenecked = false;

      for (const op of sl.ops as any[]) {
        const vid = op.view as string | undefined;
        if (vid && !views.has(vid)) { err(at, `op "${op.type}" targets unknown view "${vid}"`); continue; }
        if (vid && !paneViews.has(vid)) warn(at, `"${vid}" is not on screen in this section`);
        if (ADDS.has(op.type)) adds++;

        const ns = vid ? nodes.get(vid) : undefined;
        const needNode = (id: string, f = "id") => { if (ns && !ns.has(id)) err(at, `${op.type}.${f}: no node "${id}" on "${vid}" yet`); };
        const earn = (what: string) => {
          if (!vid || !sawBottleneck.has(vid)) return;            // the naive first build is free
          if (!open.get(vid)) err(at, `${what} arrives without a bottleneck to answer — show what breaks first (s.bottleneck)`);
          open.set(vid, false);
        };

        switch (op.type) {
          case "arch.node":
          case "arch.insert":
            nodesAdded++;
            if (ns?.has(op.id)) err(at, `node "${op.id}" added twice`);
            if (op.type === "arch.insert") {
              needNode(op.from, "from"); needNode(op.to, "to");
              if (vid && !hasEdge(vid, op.from, op.to)) err(at, `insert "${op.id}": no arrow ${op.from} → ${op.to} to split`);
              else if (vid) { dropEdge(vid, op.from, op.to); edges.get(vid)!.add(edgeKey(op.from, op.id)); edges.get(vid)!.add(edgeKey(op.id, op.to)); }
            }
            if (bottlenecked) err(at, `"${op.id}" arrives on the same slide as the bottleneck — show the bottleneck, then the fix`);
            earn(`"${op.id}"`);
            ns?.set(op.id, 1);
            break;
          case "arch.remove":
            needNode(op.id);
            ns?.delete(op.id);
            if (vid) for (const k of [...edges.get(vid)!]) if (k.split(">").includes(op.id)) edges.get(vid)!.delete(k);
            break;
          case "arch.edge":
            needNode(op.from, "from"); needNode(op.to, "to");
            if (vid && hasEdge(vid, op.from, op.to)) warn(at, `arrow ${op.from} → ${op.to} added twice`);
            if (vid) edges.get(vid)!.add(edgeKey(op.from, op.to));
            break;
          case "arch.unedge": if (vid) dropEdge(vid, op.from, op.to); break;
          case "arch.label": case "arch.edgeMark":
            if (vid && !hasEdge(vid, op.from, op.to)) err(at, `${op.type}: no arrow ${op.from} → ${op.to}`);
            break;
          case "arch.mark": case "arch.relabel": needNode(op.id); break;
          case "arch.replicas": {
            needNode(op.id);
            const before = ns?.get(op.id) ?? 1;
            if (op.count > before) {
              if (bottlenecked) err(at, `"${op.id}" scales on the same slide as the bottleneck — show the bottleneck, then the fix`);
              earn(`scaling "${op.id}" to ${op.count}`);
            }
            ns?.set(op.id, op.count);
            break;
          }
          case "arch.bottleneck":
            needNode(op.id);
            bottlenecked = true;
            if (vid) { sawBottleneck.add(vid); open.set(vid, true); }
            if (!/\d/.test(op.text)) warn(at, `bottleneck "${op.text}" has no number on it — say how far over the limit it is`);
            break;
          case "arch.token": {
            for (const n of op.path as string[]) needNode(n, "path");
            for (let i = 1; i < op.path.length; i++)
              if (vid && !hasEdge(vid, op.path[i - 1], op.path[i])) err(at, `request path: no arrow between ${op.path[i - 1]} and ${op.path[i]}`);
            if (vid) tokens.get(vid)!.set(op.name, op.path.length);
            break;
          }
          case "arch.tokenMove": {
            const len = vid ? tokens.get(vid)?.get(op.name) : undefined;
            if (len === undefined) err(at, `tokenMove "${op.name}" before its request`);
            else if (op.at >= len) err(at, `tokenMove "${op.name}" to ${op.at}, past the end of its ${len}-node path`);
            break;
          }
          case "arch.tokenDrop": if (vid) tokens.get(vid)?.delete(op.name); break;
          case "number.set": if (vid) keys.get(vid)?.add(op.key); break;
          case "number.mark": if (vid && !keys.get(vid)?.has(op.key)) err(at, `number.mark: no "${op.key}" yet`); break;
          case "number.drop": if (vid) keys.get(vid)?.delete(op.key); break;
          case "compare.row": {
            const v = vid ? views.get(vid) : undefined;
            if (v?.kind === "compare" && op.cells.length !== v.options.length)
              err(at, `compare row "${op.axis}" has ${op.cells.length} cells for ${v.options.length} options`);
            break;
          }
          case "compare.pick": {
            const v = vid ? views.get(vid) : undefined;
            if (v?.kind === "compare" && op.option !== null && !v.options.some((o) => o.id === op.option))
              err(at, `compare.pick: unknown option "${op.option}"`);
            break;
          }
        }
      }

      // one change per slide: a box may arrive with the arrow that connects it — nothing more
      if (nodesAdded > 1) err(at, `${nodesAdded} boxes on one slide — one change per slide`);
      else if (adds > 2) warn(at, `${adds} things appear on one slide — one change per slide`);

      if (sl.code) {
        const cv = views.get(sl.code.view);
        if (!cv) err(at, `spec highlight targets unknown view "${sl.code.view}"`);
        else if (cv.kind === "code") {
          const total = cv.source.split("\n").length;
          for (const l of sl.code.lines) if (l < 1 || l > total) err(at, `spec line ${l} outside 1..${total}`);
        }
      }
    });
  });

  for (const [vid, n] of everAdded)
    if (n >= 3 && !sawBottleneck.has(vid))
      warn(`views.${vid}`, `a ${n}-box diagram with no bottleneck — every component after the first build must answer one`);
  return out;
}

export const hasErrors = (i: LintIssue[]) => i.some((x) => x.level === "error");
export const formatIssues = (i: LintIssue[]) => i.map((x) => `[${x.level}] ${x.where}: ${x.message}`).join("\n");
