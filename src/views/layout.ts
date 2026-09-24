import { hierarchy, tree as d3tree } from "d3-hierarchy";
import type { TreeState, GraphState } from "@/engine/state";

export type Pt = { id: string; x: number; y: number };

/** Binary-tree layout via d3, normalised into the pane box. */
export function layoutTree(s: TreeState, w: number, h: number, pad = 70): Map<string, Pt> {
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  const build = (id: string | null, depth = 0): any => {
    if (!id || depth > 24) return null;
    const n = byId.get(id);
    if (!n) return null;
    const kids = [build(n.left, depth + 1), build(n.right, depth + 1)].filter(Boolean);
    return { id, children: kids.length ? kids : undefined, _l: !!n.left, _r: !!n.right };
  };
  const rootData = build(s.root);
  const out = new Map<string, Pt>();
  if (!rootData) return out;

  const root = hierarchy(rootData);
  const iw = Math.max(1, w - pad * 2), ih = Math.max(1, h - pad * 2);
  d3tree<any>().size([iw, ih])(root as any);
  root.each((d: any) => out.set(d.data.id, { id: d.data.id, x: d.x + pad, y: d.y + pad }));
  return out;
}

/** Graph layout: honour authored coords, otherwise lay out on a circle. */
export function layoutGraph(s: GraphState, w: number, h: number, pad = 90): Map<string, Pt> {
  const out = new Map<string, Pt>();
  const authored = s.nodes.every((n) => n.x !== undefined && n.y !== undefined);
  if (authored) {
    const xs = s.nodes.map((n) => n.x!), ys = s.nodes.map((n) => n.y!);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)], [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    const sx = x1 > x0 ? (w - pad * 2) / (x1 - x0) : 0, sy = y1 > y0 ? (h - pad * 2) / (y1 - y0) : 0;
    for (const n of s.nodes) out.set(n.id, { id: n.id, x: pad + (n.x! - x0) * sx, y: pad + (n.y! - y0) * sy });
    return out;
  }
  const r = Math.min(w, h) / 2 - pad, cx = w / 2, cy = h / 2, N = s.nodes.length || 1;
  s.nodes.forEach((n, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    out.set(n.id, { id: n.id, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  });
  return out;
}
