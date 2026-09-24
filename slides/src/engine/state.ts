import type { Style } from "@/schema/ops";
import type { Deck, ViewDecl } from "@/schema";

export type Value = number | string | boolean | null;

export type Cell = { id: string; value: Value; style: Style; born: number };
export type PointerState = { index: number; color: string; label?: string; born: number };

export type ArrayState = {
  kind: "array" | "string" | "bars";
  cells: Cell[];
  pointers: Record<string, PointerState>;
  window?: { from: number; to: number; label?: string };
  links: { a: number; b: number; label?: string }[];
  tag?: { index: number; text: string; variant: string; born: number };
  level?: { value: number; label?: string; color: string };
  gap?: { index: number; label?: string };
  area?: { from: number; to: number; height: number; label?: string; style: string };
};
export type GridState = {
  kind: "grid";
  cells: { id: string; value: Value; style: Style }[][];
  cursors: Record<string, { r: number; c: number }>;
};
export type MapState = {
  kind: "map";
  entries: { key: string; value: Value; style: Style; born: number }[];
  probe?: { key: string; hit: boolean };
};
export type LinearState = { kind: "stack" | "queue"; items: { id: string; value: Value; style: Style; born: number }[] };
export type ListState = {
  kind: "list";
  nodes: { id: string; value: Value; next: string | null; style: Style; born: number }[];
  head: string | null;
};
export type TreeState = {
  kind: "tree";
  nodes: { id: string; value: Value; left: string | null; right: string | null; style: Style }[];
  root: string;
};
export type GraphState = {
  kind: "graph";
  nodes: { id: string; label?: string; x?: number; y?: number; style: Style }[];
  edges: { from: string; to: string; weight?: number; directed: boolean; style: Style }[];
};
export type VarsState = { kind: "vars"; items: { name: string; value: Value; style: Style; born: number }[] };
export type CodeState = { kind: "code"; lang: string; source: string; lines: number[] };
export type TextState = { kind: "text"; title?: string; body: string[]; variant: string };

export type ViewState =
  | ArrayState | GridState | MapState | LinearState | ListState
  | TreeState | GraphState | VarsState | CodeState | TextState;

export type Overlay = {
  callout?: { text: string; variant: string; anchor?: any; born: number };
  /** separate channel — a wry note must be able to sit alongside a real callout */
  aside?: { text: string; born: number };
  formula?: { text: string; emphasis?: string; born: number };
  result?: { value: string; label?: string; born: number };
  camera?: { view: string; indices?: number[]; zoom?: number };
};

export type Frame = { views: Record<string, ViewState>; overlay: Overlay; label?: string };

const cell = (id: string, value: Value): Cell => ({ id, value, style: "idle", born: 0 });

export function initialState(deck: Deck): Frame {
  const views: Record<string, ViewState> = {};
  for (const v of deck.views) views[v.id] = initView(v);
  return { views, overlay: {} };
}

function initView(v: ViewDecl): ViewState {
  switch (v.kind) {
    case "array":
      return { kind: "array", cells: v.values.map((x, i) => cell(`${v.id}#${i}`, x)), pointers: {}, links: [] };
    case "string":
      return { kind: "string", cells: v.value.split("").map((x, i) => cell(`${v.id}#${i}`, x)), pointers: {}, links: [] };
    case "bars":
      return { kind: "bars", cells: v.values.map((x, i) => cell(`${v.id}#${i}`, x)), pointers: {}, links: [] };
    case "grid":
      return { kind: "grid", cursors: {},
        cells: v.cells.map((row, r) => row.map((x, c) => ({ id: `${v.id}#${r}.${c}`, value: x, style: "idle" as Style }))) };
    case "map":
      return { kind: "map", entries: v.entries.map(([k, val]) => ({ key: k, value: val, style: "idle", born: 0 })) };
    case "stack": case "queue":
      return { kind: v.kind, items: v.values.map((x, i) => ({ id: `${v.id}#${i}`, value: x, style: "idle", born: 0 })) };
    case "list":
      return { kind: "list", head: v.head ?? v.nodes[0]?.id ?? null,
        nodes: v.nodes.map((n) => ({ ...n, style: "idle" as Style, born: 0 })) };
    case "tree":
      return { kind: "tree", root: v.root, nodes: v.nodes.map((n) => ({ ...n, style: "idle" as Style })) };
    case "graph":
      return { kind: "graph", nodes: v.nodes.map((n) => ({ ...n, style: "idle" as Style })),
        edges: v.edges.map((e) => ({ ...e, style: "idle" as Style })) };
    case "vars":
      return { kind: "vars", items: v.items.map((i) => ({ ...i, style: "idle" as Style, born: 0 })) };
    case "code":
      return { kind: "code", lang: v.lang, source: v.source, lines: [] };
    case "text":
      return { kind: "text", title: v.title, body: v.body, variant: v.variant };
  }
}
