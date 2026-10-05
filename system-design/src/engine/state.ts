import type { Style, NodeKind, Tone } from "@/schema/ops";
import type { Deck, ViewDecl } from "@/schema";

export type ArchNode = {
  id: string; label: string; sub?: string; kind: NodeKind;
  tier: number; row?: number; x?: number; y?: number;
  replicas: number; noun?: string;
  style: Style; born: number;
};
export type ArchEdge = {
  from: string; to: string; label?: string; async: boolean;
  style: Style; born: number;
};
export type Token = { path: string[]; at: number; label?: string; born: number };

export type ArchState = {
  kind: "architecture";
  tiers: string[];
  nodes: ArchNode[];
  edges: ArchEdge[];
  /** the one thing that breaks next. Moves from box to box as the design grows. */
  bottleneck?: { id: string; text: string; born: number };
  /** the bottleneck just fixed — shown as a check on the slide it happened */
  resolved?: { id: string; text?: string; born: number };
  tokens: Record<string, Token>;
};

export type NumberItem = { key: string; value: string; note?: string; style: Style; born: number };
export type NumbersState = { kind: "numbers"; items: NumberItem[] };

export type CompareState = {
  kind: "compare";
  options: { id: string; title: string; sub?: string }[];
  rows: { axis: string; cells: { text: string; tone: Tone }[]; born: number }[];
  pick?: { option: string; text?: string; born: number };
};

export type CodeState = { kind: "code"; lang: string; source: string; lines: number[] };
export type TextState = { kind: "text"; title?: string; body: string[]; variant: string };

export type ViewState = ArchState | NumbersState | CompareState | CodeState | TextState;

export type Overlay = {
  callout?: { text: string; variant: string; born: number };
  /** separate channel — a wry note must be able to sit alongside a real callout */
  aside?: { text: string; born: number };
  formula?: { text: string; emphasis?: string; born: number };
  result?: { value: string; label?: string; born: number };
};

export type Frame = { views: Record<string, ViewState>; overlay: Overlay; label?: string };

export function initialState(deck: Deck): Frame {
  const views: Record<string, ViewState> = {};
  for (const v of deck.views) views[v.id] = initView(v);
  return { views, overlay: {} };
}

function initView(v: ViewDecl): ViewState {
  switch (v.kind) {
    case "architecture": return { kind: "architecture", tiers: [...v.tiers], nodes: [], edges: [], tokens: {} };
    case "numbers":      return { kind: "numbers", items: [] };
    case "compare":      return { kind: "compare", options: v.options.map((o) => ({ ...o })), rows: [] };
    case "code":         return { kind: "code", lang: v.lang, source: v.source, lines: [] };
    case "text":         return { kind: "text", title: v.title, body: v.body, variant: v.variant };
  }
}
