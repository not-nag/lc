import { z } from "zod";

/** Visual emphasis states shared by every view. */
export const Style = z.enum([
  "idle",     // default
  "compare",  // being looked at
  "active",   // current focus
  "match",    // success / found
  "bad",      // rejected / miss
  "window",   // inside a sliding window
  "done",     // finished / settled
  "visited",  // already seen
  "dim",      // pushed back
]);
export type Style = z.infer<typeof Style>;

const V = z.string().describe("id of a view declared in storyboard.views");
const val = z.union([z.number(), z.string(), z.boolean(), z.null()]);

/* ─── generic ─────────────────────────────────────────────── */
const generic = [
  z.object({ type: z.literal("callout"), text: z.string(),
    anchor: z.object({ view: V, index: z.number().optional(), key: z.string().optional(),
      nodeId: z.string().optional(), cell: z.tuple([z.number(), z.number()]).optional() }).optional(),
    variant: z.enum(["insight", "warn", "math", "note", "aside"]).default("note") }),
  z.object({ type: z.literal("formula"), text: z.string(), emphasis: z.string().optional() }),
  z.object({ type: z.literal("result"), value: z.string(), label: z.string().optional() }),
  z.object({ type: z.literal("camera"), view: V, indices: z.array(z.number()).optional(), zoom: z.number().optional() }),
  z.object({ type: z.literal("custom"), component: z.string(), props: z.record(z.string(), z.any()).default({}) }),
];

/* ─── array / string ──────────────────────────────────────── */
const array = [
  z.object({ type: z.literal("array.highlight"), view: V, indices: z.array(z.number()), style: Style }),
  z.object({ type: z.literal("array.clear"), view: V, indices: z.array(z.number()).optional() }),
  z.object({ type: z.literal("array.swap"), view: V, a: z.number(), b: z.number() }),
  z.object({ type: z.literal("array.setValue"), view: V, index: z.number(), value: val }),
  z.object({ type: z.literal("array.push"), view: V, value: val }),
  z.object({ type: z.literal("array.pop"), view: V }),
  z.object({ type: z.literal("array.window"), view: V, from: z.number(), to: z.number(), label: z.string().optional() }),
  z.object({ type: z.literal("array.windowClear"), view: V }),
  z.object({ type: z.literal("array.link"), view: V, a: z.number(), b: z.number(), label: z.string().optional() }),
  z.object({ type: z.literal("array.linkClear"), view: V }),
  /** a labelled chip pinned above one cell — what this element is looking for */
  z.object({ type: z.literal("array.tag"), view: V, index: z.number(), text: z.string(),
    variant: z.enum(["want", "have", "miss"]).default("want") }),
  z.object({ type: z.literal("array.tagClear"), view: V }),
  /** horizontal reference line across a bars chart — "cheapest so far" */
  z.object({ type: z.literal("bars.level"), view: V, value: z.number(), label: z.string().optional(),
    color: z.enum(["primary", "secondary", "accent", "success", "danger"]).default("success") }),
  z.object({ type: z.literal("bars.levelClear"), view: V }),
  /** measured vertical gap from the level line up to one bar — the profit */
  z.object({ type: z.literal("bars.gap"), view: V, index: z.number(), label: z.string().optional() }),
  z.object({ type: z.literal("bars.gapClear"), view: V }),
  /** shaded region between two bars, capped at a height — the water in a container */
  z.object({ type: z.literal("bars.area"), view: V, from: z.number(), to: z.number(),
    height: z.number(), label: z.string().optional(), style: z.enum(["fill", "ghost"]).default("fill") }),
  z.object({ type: z.literal("bars.areaClear"), view: V }),
];

/* ─── pointers (array, string, grid, list) ────────────────── */
const pointer = [
  z.object({ type: z.literal("pointer.set"), view: V, name: z.string(), index: z.number(),
    color: z.enum(["primary", "secondary", "accent", "success", "danger"]).default("primary"),
    label: z.string().optional() }),
  z.object({ type: z.literal("pointer.move"), view: V, name: z.string(), index: z.number() }),
  z.object({ type: z.literal("pointer.drop"), view: V, name: z.string() }),
];

/* ─── map / set ───────────────────────────────────────────── */
const map = [
  z.object({ type: z.literal("map.put"), view: V, key: z.string(), value: val }),
  z.object({ type: z.literal("map.get"), view: V, key: z.string(), hit: z.boolean() }),
  z.object({ type: z.literal("map.delete"), view: V, key: z.string() }),
  z.object({ type: z.literal("map.highlight"), view: V, key: z.string(), style: Style }),
  z.object({ type: z.literal("map.clear"), view: V }),
];

/* ─── stack / queue ───────────────────────────────────────── */
const linear = [
  z.object({ type: z.literal("stack.push"), view: V, value: val, label: z.string().optional() }),
  z.object({ type: z.literal("stack.pop"), view: V }),
  z.object({ type: z.literal("stack.peek"), view: V }),
  z.object({ type: z.literal("queue.enqueue"), view: V, value: val }),
  z.object({ type: z.literal("queue.dequeue"), view: V }),
];

/* ─── grid / matrix / dp table ────────────────────────────── */
const grid = [
  z.object({ type: z.literal("grid.paint"), view: V, cells: z.array(z.tuple([z.number(), z.number()])), style: Style }),
  z.object({ type: z.literal("grid.setValue"), view: V, r: z.number(), c: z.number(), value: val }),
  z.object({ type: z.literal("grid.cursor"), view: V, r: z.number(), c: z.number(), name: z.string().default("cur") }),
  z.object({ type: z.literal("grid.cursorDrop"), view: V, name: z.string().default("cur") }),
];

/* ─── linked list ─────────────────────────────────────────── */
const list = [
  z.object({ type: z.literal("list.mark"), view: V, nodeId: z.string(), style: Style }),
  z.object({ type: z.literal("list.relink"), view: V, from: z.string(), to: z.string().nullable() }),
  z.object({ type: z.literal("list.insert"), view: V, after: z.string().nullable(), nodeId: z.string(), value: val }),
  z.object({ type: z.literal("list.remove"), view: V, nodeId: z.string() }),
  z.object({ type: z.literal("list.setHead"), view: V, nodeId: z.string().nullable() }),
];

/* ─── tree / graph ────────────────────────────────────────── */
const graph = [
  z.object({ type: z.literal("tree.visit"), view: V, nodeId: z.string(),
    phase: z.enum(["pre", "in", "post"]).default("pre") }),
  z.object({ type: z.literal("tree.mark"), view: V, nodeId: z.string(), style: Style }),
  z.object({ type: z.literal("tree.setValue"), view: V, nodeId: z.string(), value: val }),
  z.object({ type: z.literal("tree.swapChildren"), view: V, nodeId: z.string() }),
  z.object({ type: z.literal("graph.mark"), view: V, nodeId: z.string(), style: Style }),
  z.object({ type: z.literal("graph.edge"), view: V, from: z.string(), to: z.string(), style: Style }),
];

/* ─── variable tracker ────────────────────────────────────── */
const vars = [
  z.object({ type: z.literal("var.set"), view: V, name: z.string(), value: val }),
  z.object({ type: z.literal("var.highlight"), view: V, name: z.string(), style: Style }),
];

export const Op = z.discriminatedUnion("type", [
  ...generic, ...array, ...pointer, ...map, ...linear, ...grid, ...list, ...graph, ...vars,
] as any) as z.ZodType<any>;

export type Op = { type: string } & Record<string, any>;

export const OP_TYPES = [
  ...generic, ...array, ...pointer, ...map, ...linear, ...grid, ...list, ...graph, ...vars,
].map((s) => (s.shape as any).type._def.value as string);
