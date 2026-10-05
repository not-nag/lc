import type { Op, NodeKind, Tone } from "@/schema/ops";
import type { Deck, Section, Slide, Pane, ViewDecl, MetaInput } from "@/schema";

/** What a trace author writes — everything but `view` is optional. */
export type PaneInput = { view: string } & Partial<Omit<Pane, "view">>;

/** A row in `show`: one view id, or several to place side by side. */
export type ShowRow = string | string[];

/** Ops that change the design — slides carrying these cannot be safely reordered or deleted. */
const STRUCTURAL = new Set([
  "arch.node", "arch.insert", "arch.remove", "arch.edge", "arch.unedge", "arch.label",
  "arch.bottleneck", "arch.resolve", "arch.replicas", "arch.relabel",
  "arch.token", "arch.tokenMove", "arch.tokenDrop",
  "number.set", "number.drop", "compare.row", "compare.pick",
]);

/**
 * How much vertical room a view naturally wants, relative to the others in the scene.
 * Derived from the declaration, so the author never hand-tunes rowSizes.
 */
function naturalWeight(v: ViewDecl | undefined): number {
  if (!v) return 1;
  switch (v.kind) {
    case "architecture": return 3.4;
    case "compare": return 2.2;
    case "code":    return Math.min(2.1, 0.4 + v.source.split("\n").length * 0.13);
    case "text":    return Math.min(1.7, 0.55 + v.body.length * 0.34);
    case "numbers": return 0.78;  // a strip of cards; beside something tall it becomes a column
  }
}

/** How much horizontal room a view wants when it shares a row. */
function naturalWidth(v: ViewDecl | undefined): number {
  if (!v) return 1;
  switch (v.kind) {
    case "architecture": return 3;
    case "compare": return 2;
    default: return 1;
  }
}

type Style = "idle" | "compare" | "active" | "match" | "bad" | "window" | "done" | "visited" | "dim";

/* ─── number formatting — compute the estimate, don't type it ─── */
const trim = (x: number) => (x < 100 ? String(Math.round(x * 10) / 10) : String(Math.round(x)));
/** 1157 → "1.2k", 115740 → "116k", 3.5e12 → "3.5T" */
export function si(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e12) return `${trim(n / 1e12)}T`;
  if (a >= 1e9) return `${trim(n / 1e9)}B`;
  if (a >= 1e6) return `${trim(n / 1e6)}M`;
  if (a >= 1e3) return `${trim(n / 1e3)}k`;
  return trim(n);
}
/** requests per second: 1157 → "1.2k/s" */
export const rate = (n: number) => `${si(n)}/s`;
/** decimal bytes: 91.25e12 → "91 TB" */
export function bytes(n: number): string {
  const u = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0; while (Math.abs(n) >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return `${trim(n)} ${u[i]}`;
}
/** thousands separators: 86400 → "86,400" */
export const commas = (n: number) => Math.round(n).toLocaleString("en-US");
export const DAY = 86_400;

/**
 * The tracer records a design being built up. There is no algorithm to run, so a trace
 * is declarative — but the handles still keep a mirror of the diagram and throw on
 * anything impossible (an arrow to a box that isn't there yet), so a trace can't
 * describe a picture the deck can't draw.
 */
export class Tracer {
  private views: ViewDecl[] = [];
  private sections: Section[] = [];
  private cur: Section | null = null;
  private pending: Op[] = [];
  private pendingCode?: { view: string; lines: number[] };
  private pendingNote?: string;
  private codeView?: string;
  private numbersView?: NumbersHandle;
  meta: Partial<Deck["meta"]> = {};

  /* ── sections & slides ─────────────────────────────────── */
  /**
   * `show` is the normal way to lay out a section: one row per entry, top to bottom, sized
   * by what each view actually needs. Nest ids to place them side by side.
   *     t.section("walkthrough", { show: ["arch", "load"] })
   * Reach for `layout` / `rows` / `rowSizes` only to override that.
   */
  section(kind: Section["kind"], opts: {
    id?: string; title?: string; show?: ShowRow[];
    layout?: PaneInput[]; rows?: number; rowSizes?: number[];
  } = {}) {
    this.flushSection();

    let layout = opts.layout;
    let rows = opts.rows;
    let rowSizes = opts.rowSizes;

    if (opts.show?.length && !layout) {
      const rowsIn = opts.show.map((r) => (Array.isArray(r) ? r : [r]));
      for (const ids of rowsIn) for (const id of ids)
        if (!this.views.some((v) => v.id === id))
          throw new Error(`section "${kind}" shows unknown view "${id}" — declare it before the section`);
      const decl = (id: string) => this.views.find((v) => v.id === id);
      layout = rowsIn.flatMap((ids, row) => {
        // split 12 columns by how much width each view wants; a diagram gets more than a list
        const ws = ids.map((id) => naturalWidth(decl(id)));
        const total = ws.reduce((a, b) => a + b, 0);
        let col = 0;
        return ids.map((view, i) => {
          const span = i === ids.length - 1 ? 12 - col : Math.max(1, Math.round((12 * ws[i]) / total));
          const p = { view, row, col, span, rowSpan: 1 };
          col += span;
          return p;
        });
      });
      rows = rowsIn.length;
      // a row is as tall as its most demanding view
      rowSizes = rowsIn.map((ids) => Math.max(...ids.map((id) => naturalWeight(decl(id)))));
    }

    this.cur = {
      id: opts.id ?? `${kind}-${this.sections.length}`,
      kind, title: opts.title,
      layout: (layout ?? []).map((p): Pane => ({ col: 0, span: 12, row: 0, rowSpan: 1, ...p })),
      rows: rows ?? Math.max(1, ...(layout ?? []).map((p) => (p.row ?? 0) + (p.rowSpan ?? 1))),
      rowSizes,
      slides: [],
    };
    return this;
  }

  /**
   * Commit everything queued since the last call as ONE slide — one click.
   * `label` is the line shown on screen; it says what this step does.
   */
  slide(label?: string, opts: { structural?: boolean } = {}) {
    if (!this.cur) this.section("walkthrough");
    const s: Slide = {
      id: `${this.cur!.id}-${this.cur!.slides.length}`,
      ops: this.pending as any, label, note: this.pendingNote,
      code: this.pendingCode,
      structural: opts.structural ?? this.pending.some((o: any) => STRUCTURAL.has(o.type)),
    };
    this.cur!.slides.push(s);
    this.pending = [];
    this.pendingCode = undefined;
    this.pendingNote = undefined;
    return this;
  }

  /** A slide that changes nothing — a pause to talk over. */
  hold(label?: string) { return this.slide(label); }

  /** Presenter note for the slide being built. Appends — build one line, say it once. */
  say(text: string) { this.pendingNote = this.pendingNote ? `${this.pendingNote} ${text}` : text; return this; }

  private push(op: Op) { this.pending.push(op); return this; }
  private addView(v: ViewDecl) {
    if (this.views.some((x) => x.id === v.id)) throw new Error(`duplicate view id "${v.id}"`);
    this.views.push(v); return v;
  }
  private flushSection() { if (this.cur) { if (this.cur.slides.length === 0) this.slide(); this.sections.push(this.cur); this.cur = null; } }

  /* ── overlays ──────────────────────────────────────────── */
  callout(text: string, variant: "insight" | "warn" | "math" | "note" = "note") {
    return this.push({ type: "callout", text, variant } as any);
  }
  /** A wry margin note. Short and dry — one or two per deck, never mid-explanation. */
  aside(text: string) { return this.push({ type: "callout", text, variant: "aside" } as any); }
  formula(text: string) { return this.push({ type: "formula", text } as any); }
  result(value: unknown, label?: string) {
    return this.push({ type: "result", value: typeof value === "string" ? value : JSON.stringify(value), label } as any);
  }

  /* ── spec (API signature / table schema) ───────────────── */
  spec(id: string, source: string, lang: "http" | "sql" | "python" | "javascript" | "text" = "text", label?: string) {
    this.codeView = id;
    this.addView({ kind: "code", id, source: source.replace(/^\n/, "").replace(/\s+$/, ""), lang, label } as ViewDecl);
    return id;
  }
  /** @deprecated the LeetCode name — same thing as spec() */
  code(id: string, source: string, lang: "http" | "sql" | "python" | "javascript" | "text" = "text", label?: string) {
    return this.spec(id, source, lang, label);
  }
  /** Highlight lines of the most recent spec on the slide being built. */
  line(...lines: number[]) { if (this.codeView) this.pendingCode = { view: this.codeView, lines }; return this; }

  text(id: string, title: string | undefined, body: string[], variant: "plain" | "bullets" | "big" = "bullets") {
    this.addView({ kind: "text", id, title, body, variant } as ViewDecl);
    return id;
  }

  /* ── handles ───────────────────────────────────────────── */
  /** An architecture diagram. Declared empty; build it one box at a time. */
  system(id: string, opts: { label?: string; tiers?: string[] } = {}) {
    this.addView({ kind: "architecture", id, label: opts.label,
      tiers: opts.tiers ?? ["client", "edge", "service", "data"] } as ViewDecl);
    return new SystemHandle(this, id);
  }
  /** The capacity readout. `t.number(...)` writes to the most recent one. */
  numbers(id: string, opts: { label?: string } = {}) {
    this.addView({ kind: "numbers", id, label: opts.label } as ViewDecl);
    return (this.numbersView = new NumbersHandle(this, id));
  }
  /** Set one figure on the current numbers panel. `note` is the derivation: "100M ÷ 86,400". */
  number(key: string, value: string | number, note?: string) {
    if (!this.numbersView) throw new Error(`t.number("${key}") before any t.numbers(...) panel`);
    this.numbersView.set(key, value, note);
    return this;
  }
  /** Two or three options side by side; add one row per axis. */
  compare(id: string, options: { id: string; title: string; sub?: string }[], opts: { label?: string } = {}) {
    this.addView({ kind: "compare", id, label: opts.label, options: options.map((o) => ({ ...o })) } as ViewDecl);
    return new CompareHandle(this, id, options.map((o) => o.id));
  }

  _op(op: Op) { return this.push(op); }

  /** Finish and emit the deck. */
  build(meta: MetaInput): Deck {
    if (this.pending.length) this.slide();
    this.flushSection();
    return { schemaVersion: 1, meta: { ...meta, ...this.meta } as any,
      views: this.views, sections: this.sections } as Deck;
  }
}

/* ─── handles ───────────────────────────────────────────── */

type Place = { tier?: number; row?: number; x?: number; y?: number; kind?: NodeKind; sub?: string };

/**
 * The diagram. The handle owns its OWN mirror of nodes and edges — never the view
 * declaration, which must stay the frame-0 (empty) state for the reducer to build on.
 */
class SystemHandle {
  private nodes = new Map<string, { replicas: number }>();
  private edges: { from: string; to: string }[] = [];
  private tokens = 0;
  bottleneckAt: string | null = null;
  constructor(private t: Tracer, public id: string) {}

  private need(id: string, what: string) {
    if (!this.nodes.has(id)) throw new Error(`${what}: no node "${id}" in "${this.id}" yet`);
  }
  hasEdge(a: string, b: string) { return this.edges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)); }
  has(id: string) { return this.nodes.has(id); }

  /** Add a box. tier: 0 client · 1 edge · 2 service · 3 data. */
  node(id: string, label: string, opts: Place = {}) {
    if (this.nodes.has(id)) throw new Error(`node "${id}" already exists`);
    this.nodes.set(id, { replicas: 1 });
    this.t._op({ type: "arch.node", view: this.id, id, label, ...opts } as any); return this;
  }
  /** Drop a box into an existing arrow, splitting it: from → id → to. */
  insert(id: string, label: string, between: [string, string], opts: Place & { labelIn?: string; labelOut?: string } = {}) {
    const [from, to] = between;
    if (!this.hasEdge(from, to)) throw new Error(`insert "${id}": no arrow ${from} → ${to}`);
    if (this.nodes.has(id)) throw new Error(`node "${id}" already exists`);
    this.nodes.set(id, { replicas: 1 });
    this.edges = this.edges.filter((e) => !((e.from === from && e.to === to) || (e.from === to && e.to === from)));
    this.edges.push({ from, to: id }, { from: id, to });
    this.t._op({ type: "arch.insert", view: this.id, id, label, from, to, ...opts } as any); return this;
  }
  remove(id: string) {
    this.need(id, "remove");
    this.nodes.delete(id);
    this.edges = this.edges.filter((e) => e.from !== id && e.to !== id);
    if (this.bottleneckAt === id) this.bottleneckAt = null;
    this.t._op({ type: "arch.remove", view: this.id, id } as any); return this;
  }
  /** Connect two boxes. `label` annotates the arrow — "116k/s". */
  edge(from: string, to: string, label?: string, opts: { async?: boolean } = {}) {
    this.need(from, "edge"); this.need(to, "edge");
    this.edges.push({ from, to });
    this.t._op({ type: "arch.edge", view: this.id, from, to, label, async: !!opts.async } as any); return this;
  }
  unedge(from: string, to: string) {
    this.edges = this.edges.filter((e) => !(e.from === from && e.to === to));
    this.t._op({ type: "arch.unedge", view: this.id, from, to } as any); return this;
  }
  /** Annotate (or re-annotate) an arrow. null clears it. */
  label(from: string, to: string, text: string | null) {
    if (!this.hasEdge(from, to)) throw new Error(`label: no arrow ${from} → ${to}`);
    this.t._op({ type: "arch.label", view: this.id, from, to, text } as any); return this;
  }
  highlight(target: string | [string, string], style: Style = "active") {
    if (Array.isArray(target)) this.t._op({ type: "arch.edgeMark", view: this.id, from: target[0], to: target[1], style } as any);
    else { this.need(target, "highlight"); this.t._op({ type: "arch.mark", view: this.id, id: target, style } as any); }
    return this;
  }
  clear() { this.t._op({ type: "arch.clear", view: this.id } as any); return this; }
  /** Mark what breaks — with a number on it. There is one marker; setting it again moves it. */
  bottleneck(id: string, text: string) {
    this.need(id, "bottleneck");
    this.bottleneckAt = id;
    this.t._op({ type: "arch.bottleneck", view: this.id, id, text } as any); return this;
  }
  /** The fix worked: the marker clears, with a check on this slide. */
  resolve(text?: string) {
    this.bottleneckAt = null;
    this.t._op({ type: "arch.resolve", view: this.id, text } as any); return this;
  }
  /** Horizontal scale: draw the box as a stack of `count`. `noun` reads "×10 shards". */
  replicas(id: string, count: number, noun?: string) {
    this.need(id, "replicas");
    this.nodes.get(id)!.replicas = count;
    this.t._op({ type: "arch.replicas", view: this.id, id, count, noun } as any); return this;
  }
  relabel(id: string, label?: string, sub?: string) {
    this.need(id, "relabel");
    this.t._op({ type: "arch.relabel", view: this.id, id, label, sub } as any); return this;
  }
  /**
   * A request token placed at path[0]. It walks the path over later slides — one
   * `step()` / `to()` per slide — so a single request can be traced end to end.
   */
  request(label: string, path: string[]) {
    for (const n of path) this.need(n, "request");
    for (let i = 1; i < path.length; i++)
      if (!this.hasEdge(path[i - 1], path[i])) throw new Error(`request "${label}": no arrow between ${path[i - 1]} and ${path[i]}`);
    const name = `r${this.tokens++}`;
    this.t._op({ type: "arch.token", view: this.id, name, path, label } as any);
    return new RequestHandle(this.t, this.id, name, path);
  }
}

class RequestHandle {
  at = 0;
  constructor(private t: Tracer, private view: string, public name: string, public path: string[]) {}
  get node() { return this.path[this.at]; }
  /** Move `n` hops along the path (animated through every hop) — optionally relabel. */
  step(n = 1, label?: string) {
    if (this.at + n > this.path.length - 1) throw new Error(`request ${this.name}: step past the end of its path`);
    this.at += n;
    this.t._op({ type: "arch.tokenMove", view: this.view, name: this.name, at: this.at, label } as any); return this;
  }
  /** Move to the next occurrence of `node` on the path. */
  to(node: string, label?: string) {
    const i = this.path.indexOf(node, this.at + 1);
    if (i < 0) throw new Error(`request ${this.name}: "${node}" is not ahead on its path`);
    return this.step(i - this.at, label);
  }
  done() { this.t._op({ type: "arch.tokenDrop", view: this.view, name: this.name } as any); return this; }
}

class NumbersHandle {
  private keys = new Set<string>();
  constructor(private t: Tracer, public id: string) {}
  set(key: string, value: string | number, note?: string) {
    this.keys.add(key);
    this.t._op({ type: "number.set", view: this.id, key, value: String(value), note } as any); return this;
  }
  highlight(key: string, style: Style = "match") {
    if (!this.keys.has(key)) throw new Error(`numbers.highlight: no "${key}"`);
    this.t._op({ type: "number.mark", view: this.id, key, style } as any); return this;
  }
  drop(key: string) { this.keys.delete(key); this.t._op({ type: "number.drop", view: this.id, key } as any); return this; }
}

type Cell = string | [string, Tone];

class CompareHandle {
  constructor(private t: Tracer, public id: string, private options: string[]) {}
  /** One axis. Cells keyed by option id; `["never", "good"]` sets a tone, a bare string is neutral. */
  row(axis: string, cells: Record<string, Cell>) {
    for (const k of Object.keys(cells))
      if (!this.options.includes(k)) throw new Error(`compare "${this.id}" row "${axis}": unknown option "${k}"`);
    const out = this.options.map((o) => {
      const c = cells[o];
      if (c === undefined) throw new Error(`compare "${this.id}" row "${axis}": missing option "${o}"`);
      return Array.isArray(c) ? { text: c[0], tone: c[1] } : { text: c, tone: "meh" as Tone };
    });
    this.t._op({ type: "compare.row", view: this.id, axis, cells: out } as any); return this;
  }
  /** Outline one option as the choice. `text` says under what conditions. */
  pick(option: string | null, text?: string) {
    if (option !== null && !this.options.includes(option)) throw new Error(`compare "${this.id}": unknown option "${option}"`);
    this.t._op({ type: "compare.pick", view: this.id, option, text } as any); return this;
  }
}

export type { SystemHandle, RequestHandle, NumbersHandle, CompareHandle };
