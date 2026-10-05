import { z } from "zod";

/** Visual emphasis states shared by every view. */
export const Style = z.enum([
  "idle",     // default
  "compare",  // being looked at
  "active",   // current focus
  "match",    // success / found
  "bad",      // rejected / hot
  "window",   // grouped
  "done",     // finished / settled
  "visited",  // already seen
  "dim",      // pushed back
]);
export type Style = z.infer<typeof Style>;

/** What a box is. Picks its shape and accent — a store is a cylinder, a queue is striped. */
export const NodeKind = z.enum(["client", "edge", "service", "cache", "store", "queue", "worker"]);
export type NodeKind = z.infer<typeof NodeKind>;

export const Tone = z.enum(["good", "bad", "meh"]);
export type Tone = z.infer<typeof Tone>;

const V = z.string().describe("id of a view declared in deck.views");

/* ─── generic ─────────────────────────────────────────────── */
const generic = [
  z.object({ type: z.literal("callout"), text: z.string(),
    variant: z.enum(["insight", "warn", "math", "note", "aside"]).default("note") }),
  z.object({ type: z.literal("formula"), text: z.string(), emphasis: z.string().optional() }),
  z.object({ type: z.literal("result"), value: z.string(), label: z.string().optional() }),
];

/* ─── architecture ────────────────────────────────────────── */
const place = {
  label: z.string(), sub: z.string().optional(),
  kind: NodeKind.default("service"),
  /** column: 0 client · 1 edge · 2 service · 3 data */
  tier: z.number().int().min(0).default(2),
  /** slot within the column, top to bottom; fractional is fine */
  row: z.number().optional(),
  /** explicit position as a fraction of the pane (0..1) — overrides tier/row */
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
};
const arch = [
  z.object({ type: z.literal("arch.node"), view: V, id: z.string(), ...place }),
  /** a box dropped into an existing arrow, splitting it in two — one change, not three */
  z.object({ type: z.literal("arch.insert"), view: V, id: z.string(), ...place,
    from: z.string(), to: z.string(),
    labelIn: z.string().optional(), labelOut: z.string().optional() }),
  z.object({ type: z.literal("arch.remove"), view: V, id: z.string() }),
  z.object({ type: z.literal("arch.edge"), view: V, from: z.string(), to: z.string(),
    label: z.string().optional(), async: z.boolean().default(false) }),
  z.object({ type: z.literal("arch.unedge"), view: V, from: z.string(), to: z.string() }),
  /** annotate an arrow — "116k/s". null clears it. */
  z.object({ type: z.literal("arch.label"), view: V, from: z.string(), to: z.string(), text: z.string().nullable() }),
  z.object({ type: z.literal("arch.mark"), view: V, id: z.string(), style: Style }),
  z.object({ type: z.literal("arch.edgeMark"), view: V, from: z.string(), to: z.string(), style: Style }),
  z.object({ type: z.literal("arch.clear"), view: V }),
  /** THE persistent object: what breaks, with a number on it. One per diagram; it moves. */
  z.object({ type: z.literal("arch.bottleneck"), view: V, id: z.string(), text: z.string() }),
  z.object({ type: z.literal("arch.resolve"), view: V, text: z.string().optional() }),
  z.object({ type: z.literal("arch.replicas"), view: V, id: z.string(), count: z.number().int().min(1),
    noun: z.string().optional() }),
  z.object({ type: z.literal("arch.relabel"), view: V, id: z.string(),
    label: z.string().optional(), sub: z.string().optional() }),
  /** a request token placed at path[0]; it walks the path over later slides */
  z.object({ type: z.literal("arch.token"), view: V, name: z.string(), path: z.array(z.string()).min(2),
    label: z.string().optional() }),
  z.object({ type: z.literal("arch.tokenMove"), view: V, name: z.string(), at: z.number().int().min(0),
    label: z.string().optional() }),
  z.object({ type: z.literal("arch.tokenDrop"), view: V, name: z.string() }),
];

/* ─── numbers ─────────────────────────────────────────────── */
const numbers = [
  z.object({ type: z.literal("number.set"), view: V, key: z.string(), value: z.string(),
    note: z.string().optional() }),
  z.object({ type: z.literal("number.mark"), view: V, key: z.string(), style: Style }),
  z.object({ type: z.literal("number.drop"), view: V, key: z.string() }),
];

/* ─── compare ─────────────────────────────────────────────── */
const compare = [
  /** one axis; cells in option order */
  z.object({ type: z.literal("compare.row"), view: V, axis: z.string(),
    cells: z.array(z.object({ text: z.string(), tone: Tone.default("meh") })) }),
  z.object({ type: z.literal("compare.pick"), view: V, option: z.string().nullable(), text: z.string().optional() }),
];

const ALL = [...generic, ...arch, ...numbers, ...compare];

export const Op = z.discriminatedUnion("type", ALL as any) as z.ZodType<any>;
export type Op = { type: string } & Record<string, any>;
export const OP_TYPES = ALL.map((s) => (s.shape as any).type._def.value as string);
