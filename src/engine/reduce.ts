import type { Op, Style } from "@/schema/ops";
import type { Storyboard } from "@/schema";
import { pointerColors } from "@/theme";
import { initialFrame, type Frame, type ArrayState, type GridState, type MapState,
  type LinearState, type ListState, type TreeState, type GraphState, type VarsState,
  type CodeState, type Value } from "./state";

/** Structural clone that keeps it cheap enough to run per step. */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/**
 * The load-bearing contract: every op is a pure state transition.
 * Given the frame before a step and the step's ops, produce the frame after.
 */
export function applyStep(prev: Frame, ops: Op[], stepIndex: number, code?: { view: string; lines: number[] }): Frame {
  const f: Frame = clone(prev);
  // overlays are momentary — they clear unless re-asserted this step
  f.overlay = {};

  for (const op of ops) {
    const v = (op as any).view ? f.views[(op as any).view] : undefined;
    switch (op.type) {
      /* generic */
      case "callout":
        if (op.variant === "aside") f.overlay.aside = { text: op.text, born: stepIndex };
        else f.overlay.callout = { text: op.text, variant: op.variant ?? "note", anchor: op.anchor, born: stepIndex };
        break;
      case "formula": f.overlay.formula = { text: op.text, emphasis: op.emphasis, born: stepIndex }; break;
      case "result":  f.overlay.result  = { value: op.value, label: op.label, born: stepIndex }; break;
      case "camera":  f.overlay.camera  = { view: op.view, indices: op.indices, zoom: op.zoom }; break;

      /* array & string */
      case "array.highlight": {
        const a = v as ArrayState;
        for (const i of op.indices as number[]) if (a.cells[i]) a.cells[i].style = op.style as Style;
        break;
      }
      case "array.clear": {
        const a = v as ArrayState;
        const idx = (op.indices as number[] | undefined) ?? a.cells.map((_, i) => i);
        for (const i of idx) if (a.cells[i]) a.cells[i].style = "idle";
        break;
      }
      case "array.swap": {
        const a = v as ArrayState;
        const t = a.cells[op.a]; a.cells[op.a] = a.cells[op.b]; a.cells[op.b] = t;
        break;
      }
      case "array.setValue": { const a = v as ArrayState; if (a.cells[op.index]) a.cells[op.index].value = op.value as Value; break; }
      case "array.push": {
        const a = v as ArrayState;
        a.cells.push({ id: `${op.view}#n${stepIndex}-${a.cells.length}`, value: op.value as Value, style: "active", born: stepIndex });
        break;
      }
      case "array.pop": (v as ArrayState).cells.pop(); break;
      case "array.window": (v as ArrayState).window = { from: op.from, to: op.to, label: op.label }; break;
      case "array.windowClear": delete (v as ArrayState).window; break;
      case "array.link": (v as ArrayState).links.push({ a: op.a, b: op.b, label: op.label }); break;
      case "array.linkClear": (v as ArrayState).links = []; break;
      case "array.tag": (v as ArrayState).tag = { index: op.index, text: op.text,
        variant: op.variant ?? "want", born: stepIndex }; break;
      case "array.tagClear": delete (v as ArrayState).tag; break;
      case "bars.level": (v as ArrayState).level = { value: op.value, label: op.label,
        color: pointerColors[(op.color ?? "success") as keyof typeof pointerColors] }; break;
      case "bars.levelClear": delete (v as ArrayState).level; break;
      case "bars.gap": (v as ArrayState).gap = { index: op.index, label: op.label }; break;
      case "bars.gapClear": delete (v as ArrayState).gap; break;
      case "bars.area": (v as ArrayState).area = { from: op.from, to: op.to, height: op.height,
        label: op.label, style: op.style ?? "fill" }; break;
      case "bars.areaClear": delete (v as ArrayState).area; break;

      /* pointers */
      case "pointer.set": {
        const a = v as ArrayState;
        a.pointers[op.name] = { index: op.index, label: op.label,
          color: pointerColors[(op.color ?? "primary") as keyof typeof pointerColors], born: stepIndex };
        break;
      }
      case "pointer.move": { const p = (v as ArrayState).pointers[op.name]; if (p) p.index = op.index; break; }
      case "pointer.drop": delete (v as ArrayState).pointers[op.name]; break;

      /* map / set */
      case "map.put": {
        const m = v as MapState;
        const e = m.entries.find((x) => x.key === op.key);
        if (e) { e.value = op.value as Value; e.style = "active"; }
        else m.entries.push({ key: op.key, value: op.value as Value, style: "active", born: stepIndex });
        break;
      }
      case "map.get": {
        const m = v as MapState;
        m.probe = { key: op.key, hit: op.hit };
        const e = m.entries.find((x) => x.key === op.key);
        if (e) e.style = op.hit ? "match" : "compare";
        break;
      }
      case "map.delete": { const m = v as MapState; m.entries = m.entries.filter((x) => x.key !== op.key); break; }
      case "map.highlight": { const e = (v as MapState).entries.find((x) => x.key === op.key); if (e) e.style = op.style as Style; break; }
      case "map.clear": { const m = v as MapState; m.entries = []; delete m.probe; break; }

      /* stack / queue */
      case "stack.push": case "queue.enqueue":
        (v as LinearState).items.push({ id: `${op.view}#n${stepIndex}`, value: op.value as Value, style: "active", born: stepIndex });
        break;
      case "stack.pop": (v as LinearState).items.pop(); break;
      case "queue.dequeue": (v as LinearState).items.shift(); break;
      case "stack.peek": { const it = (v as LinearState).items; if (it.length) it[it.length - 1].style = "compare"; break; }

      /* grid */
      case "grid.paint": for (const [r, c] of op.cells as [number, number][]) { const g = (v as GridState).cells[r]?.[c]; if (g) g.style = op.style as Style; } break;
      case "grid.setValue": { const g = (v as GridState).cells[op.r]?.[op.c]; if (g) g.value = op.value as Value; break; }
      case "grid.cursor": (v as GridState).cursors[op.name ?? "cur"] = { r: op.r, c: op.c }; break;
      case "grid.cursorDrop": delete (v as GridState).cursors[op.name ?? "cur"]; break;

      /* linked list */
      case "list.mark": { const n = (v as ListState).nodes.find((x) => x.id === op.nodeId); if (n) n.style = op.style as Style; break; }
      case "list.setHead": (v as ListState).head = op.nodeId; break;
      case "list.relink": { const n = (v as ListState).nodes.find((x) => x.id === op.from); if (n) n.next = op.to; break; }
      case "list.insert": {
        const l = v as ListState;
        l.nodes.push({ id: op.nodeId, value: op.value as Value, next: null, style: "active", born: stepIndex });
        if (op.after) { const a = l.nodes.find((x) => x.id === op.after); if (a) { const old = a.next; a.next = op.nodeId; l.nodes[l.nodes.length - 1].next = old; } }
        else { l.nodes[l.nodes.length - 1].next = l.head; l.head = op.nodeId; }
        break;
      }
      case "list.remove": {
        const l = v as ListState;
        l.nodes.forEach((n) => { if (n.next === op.nodeId) n.next = l.nodes.find((x) => x.id === op.nodeId)?.next ?? null; });
        if (l.head === op.nodeId) l.head = l.nodes.find((x) => x.id === op.nodeId)?.next ?? null;
        l.nodes = l.nodes.filter((n) => n.id !== op.nodeId);
        break;
      }

      /* tree / graph */
      case "tree.visit": { const n = (v as TreeState).nodes.find((x) => x.id === op.nodeId); if (n) n.style = "active"; break; }
      case "tree.mark": { const n = (v as TreeState).nodes.find((x) => x.id === op.nodeId); if (n) n.style = op.style as Style; break; }
      case "tree.setValue": { const n = (v as TreeState).nodes.find((x) => x.id === op.nodeId); if (n) n.value = op.value as Value; break; }
      case "tree.swapChildren": {
        const n = (v as TreeState).nodes.find((x) => x.id === op.nodeId);
        if (n) { const l = n.left; n.left = n.right; n.right = l; }
        break;
      }
      case "graph.mark": { const n = (v as GraphState).nodes.find((x) => x.id === op.nodeId); if (n) n.style = op.style as Style; break; }
      case "graph.edge": {
        const g = v as GraphState;
        const e = g.edges.find((x) => (x.from === op.from && x.to === op.to) || (!x.directed && x.from === op.to && x.to === op.from));
        if (e) e.style = op.style as Style;
        break;
      }

      /* vars */
      case "var.set": {
        const s = v as VarsState;
        const it = s.items.find((x) => x.name === op.name);
        if (it) { it.value = op.value as Value; it.style = "active"; }
        else s.items.push({ name: op.name, value: op.value as Value, style: "active", born: stepIndex });
        break;
      }
      case "var.highlight": { const it = (v as VarsState).items.find((x) => x.name === op.name); if (it) it.style = op.style as Style; break; }
    }
  }

  // code highlight is declared on the step, not as an op
  for (const vw of Object.values(f.views)) if ((vw as CodeState).kind === "code") (vw as CodeState).lines = [];
  if (code) { const cv = f.views[code.view] as CodeState | undefined; if (cv?.kind === "code") cv.lines = code.lines; }

  return f;
}

/** All frames of a scene, index 0 = before the first step. */
export function sceneFrames(sb: Storyboard, sceneIndex: number): Frame[] {
  let f = initialFrame(sb);
  const frames: Frame[] = [];
  let step = 0;
  for (let s = 0; s <= sceneIndex; s++) {
    const sc = sb.scenes[s];
    if (s === sceneIndex) frames.push(f);
    for (const st of sc.steps) {
      f = applyStep(f, st.ops as Op[], step++, st.code);
      if (s === sceneIndex) frames.push(f);
    }
  }
  return frames;
}

const cache = new Map<string, Frame[]>();
export function cachedSceneFrames(sb: Storyboard, sceneIndex: number): Frame[] {
  const k = `${sb.meta.slug}:${sceneIndex}:${sb.scenes.length}`;
  let v = cache.get(k);
  if (!v) { v = sceneFrames(sb, sceneIndex); cache.set(k, v); }
  return v;
}
