import { z } from "zod";

const base = { id: z.string(), label: z.string().optional() };

/** Columns of an architecture diagram, left to right. A node's tier picks its column. */
export const DEFAULT_TIERS = ["client", "edge", "service", "data"];

/**
 * Boxes and arrows. Declared EMPTY on purpose: every node and edge arrives through an op,
 * so the diagram is built up on screen and can never be shown finished up front.
 */
export const ArchView = z.object({ ...base, kind: z.literal("architecture"),
  tiers: z.array(z.string()).default(DEFAULT_TIERS) });

/** The capacity readout — QPS, storage, bandwidth, replica counts. Starts empty. */
export const NumbersView = z.object({ ...base, kind: z.literal("numbers") });

/** Two or three options side by side. Rows (one per axis) arrive through ops. */
export const CompareView = z.object({ ...base, kind: z.literal("compare"),
  options: z.array(z.object({ id: z.string(), title: z.string(), sub: z.string().optional() })).min(2).max(3) });

/** An API signature or table schema, highlightable line by line. */
export const CodeView = z.object({ ...base, kind: z.literal("code"),
  lang: z.enum(["http", "sql", "python", "javascript", "text"]).default("text"),
  source: z.string() });

export const TextView = z.object({ ...base, kind: z.literal("text"),
  title: z.string().optional(), body: z.array(z.string()).default([]),
  variant: z.enum(["plain", "bullets", "big"]).default("plain") });

export const ViewDecl = z.discriminatedUnion("kind", [
  ArchView, NumbersView, CompareView, CodeView, TextView,
]);
export type ViewDecl = z.infer<typeof ViewDecl>;
export type ViewKind = ViewDecl["kind"];
