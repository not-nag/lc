import type { Op, Style } from "@/schema/ops";
import type { Deck } from "@/schema";
import { initialState, type Frame, type ArchState, type ArchNode, type NumbersState,
  type CompareState, type CodeState } from "./state";

/** Structural clone that keeps it cheap enough to run per step. */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Arrows are looked up in either direction — a response travels the request's arrow back. */
const findEdge = (a: ArchState, from: string, to: string) =>
  a.edges.find((e) => e.from === from && e.to === to) ?? a.edges.find((e) => e.from === to && e.to === from);

const newNode = (op: any, slideIndex: number): ArchNode => ({
  id: op.id, label: op.label, sub: op.sub, kind: op.kind ?? "service",
  tier: op.tier ?? 2, row: op.row, x: op.x, y: op.y,
  replicas: 1, style: "active", born: slideIndex,
});

/**
 * The load-bearing contract: every op is a pure state transition.
 * Given the frame before a step and the step's ops, produce the frame after.
 */
export function applySlide(prev: Frame, ops: Op[], slideIndex: number, code?: { view: string; lines: number[] }): Frame {
  const f: Frame = clone(prev);
  // overlays are momentary — they clear unless re-asserted this step
  f.overlay = {};
  // a node lit because it just arrived settles back once the next slide starts
  for (const v of Object.values(f.views))
    if (v.kind === "architecture") {
      for (const n of v.nodes) if (n.style === "active" && n.born === slideIndex - 1) n.style = "idle";
      for (const e of v.edges) if (e.style === "active" && e.born === slideIndex - 1) e.style = "idle";
    }

  for (const op of ops) {
    const v = (op as any).view ? f.views[(op as any).view] : undefined;
    switch (op.type) {
      /* generic */
      case "callout":
        if (op.variant === "aside") f.overlay.aside = { text: op.text, born: slideIndex };
        else f.overlay.callout = { text: op.text, variant: op.variant ?? "note", born: slideIndex };
        break;
      case "formula": f.overlay.formula = { text: op.text, emphasis: op.emphasis, born: slideIndex }; break;
      case "result":  f.overlay.result  = { value: op.value, label: op.label, born: slideIndex }; break;

      /* architecture */
      case "arch.node": {
        const a = v as ArchState;
        if (!a.nodes.some((n) => n.id === op.id)) a.nodes.push(newNode(op, slideIndex));
        break;
      }
      case "arch.insert": {
        const a = v as ArchState;
        if (a.nodes.some((n) => n.id === op.id)) break;
        const old = findEdge(a, op.from, op.to);
        a.nodes.push(newNode(op, slideIndex));
        a.edges = a.edges.filter((e) => e !== old);
        a.edges.push({ from: op.from, to: op.id, label: op.labelIn ?? old?.label, async: !!old?.async, style: "idle", born: slideIndex });
        a.edges.push({ from: op.id, to: op.to, label: op.labelOut, async: !!old?.async, style: "idle", born: slideIndex });
        break;
      }
      case "arch.remove": {
        const a = v as ArchState;
        a.nodes = a.nodes.filter((n) => n.id !== op.id);
        a.edges = a.edges.filter((e) => e.from !== op.id && e.to !== op.id);
        if (a.bottleneck?.id === op.id) delete a.bottleneck;
        break;
      }
      case "arch.edge": {
        const a = v as ArchState;
        if (!a.edges.some((e) => e.from === op.from && e.to === op.to))
          a.edges.push({ from: op.from, to: op.to, label: op.label, async: !!op.async, style: "active", born: slideIndex });
        break;
      }
      case "arch.unedge": { const a = v as ArchState; a.edges = a.edges.filter((e) => !(e.from === op.from && e.to === op.to)); break; }
      case "arch.label": { const e = findEdge(v as ArchState, op.from, op.to); if (e) e.label = op.text ?? undefined; break; }
      case "arch.mark": { const n = (v as ArchState).nodes.find((x) => x.id === op.id); if (n) n.style = op.style as Style; break; }
      case "arch.edgeMark": { const e = findEdge(v as ArchState, op.from, op.to); if (e) e.style = op.style as Style; break; }
      case "arch.clear": {
        const a = v as ArchState;
        for (const n of a.nodes) n.style = "idle";
        for (const e of a.edges) e.style = "idle";
        break;
      }
      case "arch.bottleneck": (v as ArchState).bottleneck = { id: op.id, text: op.text, born: slideIndex }; break;
      case "arch.resolve": {
        const a = v as ArchState;
        if (a.bottleneck) a.resolved = { id: a.bottleneck.id, text: op.text, born: slideIndex };
        delete a.bottleneck;
        break;
      }
      case "arch.replicas": {
        const n = (v as ArchState).nodes.find((x) => x.id === op.id);
        if (n) { n.replicas = op.count; n.noun = op.noun; }
        break;
      }
      case "arch.relabel": {
        const n = (v as ArchState).nodes.find((x) => x.id === op.id);
        if (n) { if (op.label !== undefined) n.label = op.label; if (op.sub !== undefined) n.sub = op.sub; }
        break;
      }
      case "arch.token": (v as ArchState).tokens[op.name] = { path: op.path, at: 0, label: op.label, born: slideIndex }; break;
      case "arch.tokenMove": {
        const tk = (v as ArchState).tokens[op.name];
        if (tk) { tk.at = Math.min(op.at, tk.path.length - 1); if (op.label !== undefined) tk.label = op.label; }
        break;
      }
      case "arch.tokenDrop": delete (v as ArchState).tokens[op.name]; break;

      /* numbers */
      case "number.set": {
        const s = v as NumbersState;
        const it = s.items.find((x) => x.key === op.key);
        if (it) { it.value = op.value; it.note = op.note; it.style = "active"; }
        else s.items.push({ key: op.key, value: op.value, note: op.note, style: "active", born: slideIndex });
        break;
      }
      case "number.mark": { const it = (v as NumbersState).items.find((x) => x.key === op.key); if (it) it.style = op.style as Style; break; }
      case "number.drop": { const s = v as NumbersState; s.items = s.items.filter((x) => x.key !== op.key); break; }

      /* compare */
      case "compare.row": (v as CompareState).rows.push({ axis: op.axis, cells: op.cells, born: slideIndex }); break;
      case "compare.pick": {
        const c = v as CompareState;
        if (op.option === null) delete c.pick;
        else c.pick = { option: op.option, text: op.text, born: slideIndex };
        break;
      }
    }
  }

  // a number lit because it just changed settles on the next slide unless re-lit
  for (const v of Object.values(f.views))
    if (v.kind === "numbers")
      for (const it of v.items)
        if (it.style === "active" && !ops.some((o: any) => o.type === "number.set" && o.view && f.views[o.view] === v && o.key === it.key))
          it.style = "idle";

  // code highlight is declared on the step, not as an op
  for (const vw of Object.values(f.views)) if ((vw as CodeState).kind === "code") (vw as CodeState).lines = [];
  if (code) { const cv = f.views[code.view] as CodeState | undefined; if (cv?.kind === "code") cv.lines = code.lines; }

  return f;
}

/**
 * Every state the deck passes through: states[0] is before slide 0, states[i+1] is
 * after slide i. A pure fold, so any slide can be shown without replaying from the start.
 */
export function deckStates(deck: Deck): Frame[] {
  let f = initialState(deck);
  const out: Frame[] = [f];
  let i = 0;
  for (const sec of deck.sections)
    for (const sl of sec.slides) {
      f = applySlide(f, sl.ops as Op[], i++, sl.code);
      out.push(f);
    }
  return out;
}

const cache = new WeakMap<Deck, Frame[]>();
export function cachedDeckStates(deck: Deck): Frame[] {
  let v = cache.get(deck);
  if (!v) { v = deckStates(deck); cache.set(deck, v); }
  return v;
}
