import type { Op } from "@/schema/ops";
import type { Storyboard, Scene, Step, Pane, ViewDecl, MetaInput } from "@/schema";

/** What a trace author writes — everything but `view` is optional. */
export type PaneInput = { view: string } & Partial<Omit<Pane, "view">>;

/** A row in `show`: one view id, or several to place side by side. */
export type ShowRow = string | string[];

/**
 * How much vertical room a view naturally wants, relative to the others in the scene.
 * Derived from the declaration, so a 9-line code pane asks for more than a 3-line one and
 * a row of pills asks for almost nothing. This is what makes `show` work without the
 * author hand-tuning rowSizes.
 */
function naturalWeight(v: ViewDecl | undefined): number {
  if (!v) return 1;
  switch (v.kind) {
    case "bars": case "tree": case "graph": return 1.9;
    case "grid":  return Math.min(2.4, 0.5 + v.cells.length * 0.3);
    case "code":  return Math.min(2.1, 0.4 + v.source.split("\n").length * 0.13);
    case "text":  return Math.min(1.7, 0.55 + v.body.length * 0.34);
    case "stack": return 1.5;
    case "queue": return 0.8;
    case "vars":  return 0.42;
    case "array": case "string": return 1.3;   // cells plus pointers, brackets, index row
    default:      return 1;                    // map, list
  }
}

type V = number | string | boolean | null;
type Style = "idle" | "compare" | "active" | "match" | "bad" | "window" | "done" | "visited" | "dim";

/**
 * The tracer is both a data-structure library and a recorder. Solution code runs
 * for real against these handles; the op log falls out as a side effect, so the
 * animation can never disagree with the algorithm.
 */
export class Tracer {
  private views: ViewDecl[] = [];
  private scenes: Scene[] = [];
  private cur: Scene | null = null;
  private pending: Op[] = [];
  private pendingCode?: { view: string; lines: number[] };
  private pendingVoice?: string;
  private codeView?: string;
  meta: Partial<Storyboard["meta"]> = {};

  /* ── scenes & beats ────────────────────────────────────── */
  /**
   * `show` is the normal way to lay out a scene: one row per entry, top to bottom, sized by
   * what each view actually needs. Nest ids to place them side by side.
   *     t.scene("walkthrough", { show: ["nums", ["seen", "v"], "code"] })
   * Reach for `layout` / `rows` / `rowSizes` only to override that.
   */
  scene(kind: Scene["kind"], opts: {
    id?: string; title?: string; show?: ShowRow[];
    layout?: PaneInput[]; rows?: number; rowSizes?: number[];
    voice?: string; transition?: Scene["transition"];
  } = {}) {
    this.flushScene();

    let layout = opts.layout;
    let rows = opts.rows;
    let rowSizes = opts.rowSizes;

    if (opts.show?.length && !layout) {
      const rowsIn = opts.show.map((r) => (Array.isArray(r) ? r : [r]));
      layout = rowsIn.flatMap((ids, row) =>
        ids.map((view, i) => ({
          view, row, col: Math.round((12 / ids.length) * i),
          span: Math.round(12 / ids.length), rowSpan: 1, scale: 1,
        })));
      rows = rowsIn.length;
      // a row is as tall as its most demanding view
      rowSizes = rowsIn.map((ids) =>
        Math.max(...ids.map((id) => naturalWeight(this.views.find((v) => v.id === id)))));
      for (const ids of rowsIn) for (const id of ids)
        if (!this.views.some((v) => v.id === id))
          throw new Error(`scene "${kind}" shows unknown view "${id}" — declare it before the scene`);
    }

    this.cur = {
      id: opts.id ?? `${kind}-${this.scenes.length}`,
      kind, title: opts.title,
      layout: (layout ?? []).map((p): Pane => ({ col: 0, span: 12, row: 0, rowSpan: 1, scale: 1, ...p })),
      rows: rows ?? Math.max(1, ...(layout ?? []).map((p) => (p.row ?? 0) + (p.rowSpan ?? 1))),
      rowSizes,
      voice: opts.voice, steps: [], transition: opts.transition ?? "wipe",
    };
    return this;
  }

  /**
   * Commit everything queued since the last beat as one moment in time.
   * `label` states what this step DOES — it is not narration, so a voiceover
   * added later never contradicts it.
   */
  beat(label?: string, beats = 1) {
    if (!this.cur) this.scene("walkthrough");
    const step: Step = { beats, ops: this.pending as any, label, voice: this.pendingVoice, code: this.pendingCode };
    this.cur!.steps.push(step);
    this.pending = [];
    this.pendingCode = undefined;
    this.pendingVoice = undefined;
    return this;
  }

  /** Hold the current picture for longer without changing anything. */
  hold(beats = 1, label?: string) { return this.beat(label, beats); }

  /**
   * Narration for the beat being built. This is what gets SPOKEN — write it the way you
   * would say it out loud, with the pointers as characters. Separate from the on-screen
   * label, which stays terse.
   */
  say(text: string) { this.pendingVoice = this.pendingVoice ? `${this.pendingVoice} ${text}` : text; return this; }

  private push(op: Op) { this.pending.push(op); return this; }
  private addView(v: ViewDecl) {
    if (this.views.some((x) => x.id === v.id)) throw new Error(`duplicate view id "${v.id}"`);
    this.views.push(v); return v;
  }
  private flushScene() { if (this.cur) { if (this.cur.steps.length === 0) this.beat(); this.scenes.push(this.cur); this.cur = null; } }

  /* ── overlays ──────────────────────────────────────────── */
  callout(text: string, variant: "insight" | "warn" | "math" | "note" | "aside" = "note", anchor?: any) {
    return this.push({ type: "callout", text, variant, anchor } as any);
  }
  /** A wry margin note. Keep it short and dry — one or two per video, never mid-explanation. */
  aside(text: string) { return this.push({ type: "callout", text, variant: "aside" } as any); }
  formula(text: string) { return this.push({ type: "formula", text } as any); }
  result(value: unknown, label?: string) { return this.push({ type: "result", value: JSON.stringify(value).replace(/"/g, ""), label } as any); }
  zoom(view: string, z = 1.15) { return this.push({ type: "camera", view, zoom: z } as any); }

  /* ── code ──────────────────────────────────────────────── */
  code(id: string, source: string, lang: "python" | "javascript" | "java" | "cpp" = "python", label?: string) {
    this.codeView = id;
    this.addView({ kind: "code", id, source: source.replace(/^\n/, "").replace(/\s+$/, ""), lang, label } as ViewDecl);
    return id;
  }
  /** Highlight source lines for the beat being built. */
  line(...lines: number[]) { if (this.codeView) this.pendingCode = { view: this.codeView, lines }; return this; }

  /* ── handles ───────────────────────────────────────────── */
  array(id: string, values: V[], opts: { label?: string; showIndices?: boolean } = {}) {
    this.addView({ kind: "array", id, values: [...values], showIndices: opts.showIndices ?? true, label: opts.label } as ViewDecl);
    return new ArrayHandle(this as any, id, [...values]);
  }
  /** A price/height chart. Same ops as an array, plus level() and gap(). */
  bars(id: string, values: number[], opts: { label?: string; unit?: string; showValues?: boolean } = {}) {
    this.addView({ kind: "bars", id, values: [...values], unit: opts.unit ?? "",
      showValues: opts.showValues ?? true, xLabel: "", label: opts.label } as ViewDecl);
    return new BarsHandle(this as any, id, [...values]);
  }
  string(id: string, value: string, opts: { label?: string } = {}) {
    this.addView({ kind: "string", id, value, showIndices: true, label: opts.label } as ViewDecl);
    return new ArrayHandle(this as any, id, value.split(""));
  }
  map(id: string, opts: { label?: string; asSet?: boolean; keyLabel?: string; valueLabel?: string } = {}) {
    this.addView({ kind: "map", id, entries: [], asSet: !!opts.asSet, label: opts.label,
      keyLabel: opts.keyLabel ?? "key", valueLabel: opts.valueLabel ?? "value" } as ViewDecl);
    return new MapHandle(this as any, id);
  }
  set(id: string, opts: { label?: string } = {}) { return this.map(id, { ...opts, asSet: true }); }
  stack(id: string, opts: { label?: string } = {}) {
    this.addView({ kind: "stack", id, values: [], label: opts.label } as ViewDecl);
    return new LinearHandle(this as any, id, "stack");
  }
  queue(id: string, opts: { label?: string } = {}) {
    this.addView({ kind: "queue", id, values: [], label: opts.label } as ViewDecl);
    return new LinearHandle(this as any, id, "queue");
  }
  grid(id: string, cells: V[][], opts: { label?: string } = {}) {
    this.addView({ kind: "grid", id, cells: cells.map((r) => [...r]), showCoords: false, label: opts.label } as ViewDecl);
    return new GridHandle(this as any, id, cells.map((r) => [...r]));
  }
  vars(id = "vars", opts: { label?: string } = {}) {
    this.addView({ kind: "vars", id, items: [], label: opts.label } as ViewDecl);
    return new VarsHandle(this as any, id);
  }
  text(id: string, title: string | undefined, body: string[], variant: "plain" | "bullets" | "big" = "bullets") {
    this.addView({ kind: "text", id, title, body, variant } as ViewDecl);
    return id;
  }
  tree(id: string, nodes: { id: string; value: V; left?: string | null; right?: string | null }[], root: string, opts: { label?: string } = {}) {
    this.addView({ kind: "tree", id, root, label: opts.label,
      nodes: nodes.map((n) => ({ id: n.id, value: n.value, left: n.left ?? null, right: n.right ?? null })) } as ViewDecl);
    return new TreeHandle(this as any, id, nodes.map((n) => ({ ...n, left: n.left ?? null, right: n.right ?? null })));
  }
  graph(id: string, nodes: { id: string; label?: string; x?: number; y?: number }[],
        edges: { from: string; to: string; weight?: number; directed?: boolean }[], opts: { label?: string } = {}) {
    this.addView({ kind: "graph", id, nodes, label: opts.label,
      edges: edges.map((e) => ({ ...e, directed: e.directed ?? false })) } as ViewDecl);
    return new GraphHandle(this as any, id);
  }
  list(id: string, values: V[], opts: { label?: string } = {}) {
    const mk = () => values.map((v, i) => ({
      id: `${id}n${i}`, value: v, next: i < values.length - 1 ? `${id}n${i + 1}` : null,
    }));
    // The handle MUST own a separate copy: it mutates as the algorithm runs, and the
    // declaration has to stay the frame-0 state for the reducer to build on.
    this.addView({ kind: "list", id, nodes: mk(), head: `${id}n0`, label: opts.label } as ViewDecl);
    return new ListHandle(this as any, id, mk());
  }

  _op(op: Op) { return this.push(op); }

  /** Finish and emit a validated-shaped storyboard. */
  build(meta: MetaInput): Storyboard {
    if (this.pending.length) this.beat();
    this.flushScene();
    return { schemaVersion: 1, meta: { ...meta, ...this.meta } as any, views: this.views, scenes: this.scenes } as Storyboard;
  }
}

/* ─── handles ───────────────────────────────────────────── */

class ArrayHandle {
  constructor(protected t: Tracer, public id: string, public values: V[]) {}
  get length() { return this.values.length; }
  at(i: number) { return this.values[i]; }
  /** reading a cell also highlights it — the common case */
  read(i: number, style: Style = "compare") { this.highlight([i], style); return this.values[i]; }
  highlight(indices: number[], style: Style = "active") { this.t._op({ type: "array.highlight", view: this.id, indices, style } as any); return this; }
  clear(indices?: number[]) { this.t._op({ type: "array.clear", view: this.id, indices } as any); return this; }
  swap(a: number, b: number) { const x = this.values[a]; this.values[a] = this.values[b]; this.values[b] = x;
    this.t._op({ type: "array.swap", view: this.id, a, b } as any); return this; }
  set(i: number, v: V) { this.values[i] = v; this.t._op({ type: "array.setValue", view: this.id, index: i, value: v } as any); return this; }
  push(v: V) { this.values.push(v); this.t._op({ type: "array.push", view: this.id, value: v } as any); return this; }
  pop() { const v = this.values.pop(); this.t._op({ type: "array.pop", view: this.id } as any); return v; }
  window(from: number, to: number, label?: string) { this.t._op({ type: "array.window", view: this.id, from, to, label } as any); return this; }
  windowClear() { this.t._op({ type: "array.windowClear", view: this.id } as any); return this; }
  link(a: number, b: number, label?: string) { this.t._op({ type: "array.link", view: this.id, a, b, label } as any); return this; }
  linkClear() { this.t._op({ type: "array.linkClear", view: this.id } as any); return this; }
  /** Pin a chip above one cell — e.g. what this number still needs. */
  tag(index: number, text: string, variant: "want" | "have" | "miss" = "want") {
    this.t._op({ type: "array.tag", view: this.id, index, text, variant } as any); return this; }
  tagClear() { this.t._op({ type: "array.tagClear", view: this.id } as any); return this; }
  pointer(name: string, index: number, color: "primary" | "secondary" | "accent" | "success" | "danger" = "primary", label?: string) {
    this.t._op({ type: "pointer.set", view: this.id, name, index, color, label } as any); return this; }
  move(name: string, index: number) { this.t._op({ type: "pointer.move", view: this.id, name, index } as any); return this; }
  drop(name: string) { this.t._op({ type: "pointer.drop", view: this.id, name } as any); return this; }
}

class BarsHandle extends ArrayHandle {
  /** Horizontal reference line — e.g. the cheapest price seen so far. */
  level(value: number, label?: string, color: "primary" | "secondary" | "accent" | "success" | "danger" = "success") {
    (this as any).t._op({ type: "bars.level", view: this.id, value, label, color }); return this;
  }
  levelClear() { (this as any).t._op({ type: "bars.levelClear", view: this.id }); return this; }
  /** Measured gap from the level line up to one bar — the profit. */
  gap(index: number, label?: string) { (this as any).t._op({ type: "bars.gap", view: this.id, index, label }); return this; }
  gapClear() { (this as any).t._op({ type: "bars.gapClear", view: this.id }); return this; }
  /** Shaded region between two bars, capped at `height` — water held between two walls. */
  area(from: number, to: number, height: number, label?: string, style: "fill" | "ghost" = "fill") {
    (this as any).t._op({ type: "bars.area", view: this.id, from, to, height, label, style }); return this;
  }
  areaClear() { (this as any).t._op({ type: "bars.areaClear", view: this.id }); return this; }
}

class MapHandle {
  private m = new Map<string, V>();
  constructor(private t: Tracer, public id: string) {}
  private k(key: unknown) { return String(key); }
  put(key: unknown, value: V = true) { this.m.set(this.k(key), value);
    this.t._op({ type: "map.put", view: this.id, key: this.k(key), value } as any); return this; }
  add(key: unknown) { return this.put(key, null); }
  /** Emits the probe animation AND returns the real answer. */
  has(key: unknown) { const hit = this.m.has(this.k(key));
    this.t._op({ type: "map.get", view: this.id, key: this.k(key), hit } as any); return hit; }
  get(key: unknown) { const hit = this.m.has(this.k(key));
    this.t._op({ type: "map.get", view: this.id, key: this.k(key), hit } as any); return this.m.get(this.k(key)); }
  peek(key: unknown) { return this.m.get(this.k(key)); }
  delete(key: unknown) { this.m.delete(this.k(key)); this.t._op({ type: "map.delete", view: this.id, key: this.k(key) } as any); return this; }
  highlight(key: unknown, style: Style = "match") { this.t._op({ type: "map.highlight", view: this.id, key: this.k(key), style } as any); return this; }
  clear() { this.m.clear(); this.t._op({ type: "map.clear", view: this.id } as any); return this; }
  get size() { return this.m.size; }
}

class LinearHandle {
  private a: V[] = [];
  constructor(private t: Tracer, public id: string, private kind: "stack" | "queue") {}
  get length() { return this.a.length; }
  get isEmpty() { return this.a.length === 0; }
  push(v: V, label?: string) { this.a.push(v);
    this.t._op({ type: this.kind === "stack" ? "stack.push" : "queue.enqueue", view: this.id, value: v, label } as any); return this; }
  enqueue(v: V) { return this.push(v); }
  pop() { const v = this.a.pop(); this.t._op({ type: "stack.pop", view: this.id } as any); return v; }
  dequeue() { const v = this.a.shift(); this.t._op({ type: "queue.dequeue", view: this.id } as any); return v; }
  peek() { this.t._op({ type: "stack.peek", view: this.id } as any); return this.a[this.a.length - 1]; }
  top() { return this.a[this.a.length - 1]; }
}

class GridHandle {
  constructor(private t: Tracer, public id: string, public cells: V[][]) {}
  get rows() { return this.cells.length; }
  get cols() { return this.cells[0]?.length ?? 0; }
  at(r: number, c: number) { return this.cells[r]?.[c]; }
  paint(cells: [number, number][], style: Style = "active") { this.t._op({ type: "grid.paint", view: this.id, cells, style } as any); return this; }
  set(r: number, c: number, v: V) { this.cells[r][c] = v; this.t._op({ type: "grid.setValue", view: this.id, r, c, value: v } as any); return this; }
  cursor(r: number, c: number, name = "cur") { this.t._op({ type: "grid.cursor", view: this.id, r, c, name } as any); return this; }
  dropCursor(name = "cur") { this.t._op({ type: "grid.cursorDrop", view: this.id, name } as any); return this; }
}

class VarsHandle {
  constructor(private t: Tracer, public id: string) {}
  set(name: string, value: V) { this.t._op({ type: "var.set", view: this.id, name, value } as any); return this; }
  setAll(o: Record<string, V>) { for (const [k, v] of Object.entries(o)) this.set(k, v); return this; }
  highlight(name: string, style: Style = "match") { this.t._op({ type: "var.highlight", view: this.id, name, style } as any); return this; }
}

class TreeHandle {
  constructor(private t: Tracer, public id: string, public nodes: { id: string; value: V; left: string | null; right: string | null }[]) {}
  node(id: string) { return this.nodes.find((n) => n.id === id); }
  left(id: string) { return this.node(id)?.left ?? null; }
  right(id: string) { return this.node(id)?.right ?? null; }
  value(id: string) { return this.node(id)?.value; }
  visit(nodeId: string, phase: "pre" | "in" | "post" = "pre") { this.t._op({ type: "tree.visit", view: this.id, nodeId, phase } as any); return this; }
  mark(nodeId: string, style: Style = "done") { this.t._op({ type: "tree.mark", view: this.id, nodeId, style } as any); return this; }
  set(nodeId: string, value: V) { const n = this.node(nodeId); if (n) n.value = value;
    this.t._op({ type: "tree.setValue", view: this.id, nodeId, value } as any); return this; }
  /** Mirror one node's children. Updates the handle so later reads see the new shape. */
  swapChildren(nodeId: string) {
    const n = this.node(nodeId);
    if (n) { const l = n.left; n.left = n.right; n.right = l; }
    this.t._op({ type: "tree.swapChildren", view: this.id, nodeId } as any); return this;
  }
}

class GraphHandle {
  constructor(private t: Tracer, public id: string) {}
  mark(nodeId: string, style: Style = "visited") { this.t._op({ type: "graph.mark", view: this.id, nodeId, style } as any); return this; }
  edge(from: string, to: string, style: Style = "active") { this.t._op({ type: "graph.edge", view: this.id, from, to, style } as any); return this; }
}

class ListHandle {
  constructor(private t: Tracer, public id: string, public nodes: { id: string; value: V; next: string | null }[]) {}
  head() { return this.nodes[0]?.id ?? null; }
  node(id: string) { return this.nodes.find((n) => n.id === id); }
  next(id: string) { return this.node(id)?.next ?? null; }
  value(id: string) { return this.node(id)?.value; }
  mark(nodeId: string, style: Style = "active") { this.t._op({ type: "list.mark", view: this.id, nodeId, style } as any); return this; }
  relink(from: string, to: string | null) { const n = this.node(from); if (n) n.next = to;
    this.t._op({ type: "list.relink", view: this.id, from, to } as any); return this; }
  remove(nodeId: string) { this.t._op({ type: "list.remove", view: this.id, nodeId } as any); return this; }
  setHead(nodeId: string | null) { this.t._op({ type: "list.setHead", view: this.id, nodeId } as any); return this; }
}

export type { ArrayHandle, BarsHandle, MapHandle, LinearHandle, GridHandle, VarsHandle, TreeHandle, GraphHandle, ListHandle };
