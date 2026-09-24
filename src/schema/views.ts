import { z } from "zod";

const val = z.union([z.number(), z.string(), z.boolean(), z.null()]);
const base = { id: z.string(), label: z.string().optional() };

export const ArrayView = z.object({ ...base, kind: z.literal("array"),
  values: z.array(val), showIndices: z.boolean().default(true), cellWidth: z.number().optional() });

export const StringView = z.object({ ...base, kind: z.literal("string"),
  value: z.string(), showIndices: z.boolean().default(true) });

/** A price/height chart. Shares ArrayState, so array + pointer ops apply as-is. */
export const BarsView = z.object({ ...base, kind: z.literal("bars"),
  values: z.array(z.number()), unit: z.string().default(""),
  showValues: z.boolean().default(true), xLabel: z.string().default("") });

export const GridView = z.object({ ...base, kind: z.literal("grid"),
  cells: z.array(z.array(val)), showCoords: z.boolean().default(false) });

export const MapView = z.object({ ...base, kind: z.literal("map"),
  entries: z.array(z.tuple([z.string(), val])).default([]),
  keyLabel: z.string().default("key"), valueLabel: z.string().default("value"),
  asSet: z.boolean().default(false) });

export const StackView = z.object({ ...base, kind: z.literal("stack"), values: z.array(val).default([]) });
export const QueueView = z.object({ ...base, kind: z.literal("queue"), values: z.array(val).default([]) });

export const ListView = z.object({ ...base, kind: z.literal("list"),
  nodes: z.array(z.object({ id: z.string(), value: val, next: z.string().nullable().default(null) })),
  head: z.string().nullable().default(null) });

export const TreeView = z.object({ ...base, kind: z.literal("tree"),
  nodes: z.array(z.object({ id: z.string(), value: val,
    left: z.string().nullable().default(null), right: z.string().nullable().default(null) })),
  root: z.string() });

export const GraphView = z.object({ ...base, kind: z.literal("graph"),
  nodes: z.array(z.object({ id: z.string(), label: z.string().optional(),
    x: z.number().optional(), y: z.number().optional() })),
  edges: z.array(z.object({ from: z.string(), to: z.string(),
    weight: z.number().optional(), directed: z.boolean().default(false) })) });

export const VarsView = z.object({ ...base, kind: z.literal("vars"),
  items: z.array(z.object({ name: z.string(), value: val })).default([]) });

export const CodeView = z.object({ ...base, kind: z.literal("code"),
  lang: z.enum(["python", "javascript", "java", "cpp"]).default("python"),
  source: z.string() });

export const TextView = z.object({ ...base, kind: z.literal("text"),
  title: z.string().optional(), body: z.array(z.string()).default([]),
  variant: z.enum(["plain", "bullets", "big"]).default("plain") });

export const ViewDecl = z.discriminatedUnion("kind", [
  ArrayView, StringView, BarsView, GridView, MapView, StackView, QueueView,
  ListView, TreeView, GraphView, VarsView, CodeView, TextView,
]);
export type ViewDecl = z.infer<typeof ViewDecl>;
export type ViewKind = ViewDecl["kind"];
