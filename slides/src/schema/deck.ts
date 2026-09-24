import { z } from "zod";
import { Op } from "./ops";
import { ViewDecl } from "./views";

export const SCHEMA_VERSION = 1;

/**
 * One click. Everything in `ops` happens together, then the deck waits for you.
 * There is no duration here — a slide lasts as long as you leave it up.
 */
export const Slide = z.object({
  id: z.string(),
  ops: z.array(Op).default([]),
  /** the line shown on screen — what this step does */
  label: z.string().optional(),
  /** presenter note; shown to you while recording, never to the viewer */
  note: z.string().optional(),
  /** source lines to highlight, if the section shows a code view */
  code: z.object({ view: z.string(), lines: z.array(z.number()) }).optional(),
  /** true when this slide advances the algorithm — reordering it changes everything after */
  structural: z.boolean().default(false),
});
export type Slide = z.infer<typeof Slide>;

export const Pane = z.object({
  view: z.string(),
  col: z.number().min(0).max(12).default(0),
  span: z.number().min(1).max(12).default(12),
  row: z.number().default(0),
  rowSpan: z.number().default(1),
});
export type Pane = z.infer<typeof Pane>;

/** A run of slides sharing one screen layout. */
export const Section = z.object({
  id: z.string(),
  kind: z.enum(["hook", "problem", "walkthrough", "code", "intuition", "custom"]),
  title: z.string().optional(),
  layout: z.array(Pane).default([]),
  rows: z.number().default(1),
  rowSizes: z.array(z.number()).optional(),
  slides: z.array(Slide).min(1),
});
export type Section = z.infer<typeof Section>;

export const Deck = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  /** set once you edit a deck by hand; the trace will then refuse to overwrite it */
  edited: z.boolean().default(false),
  meta: z.object({
    slug: z.string(),
    number: z.number().optional(),
    title: z.string(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Easy"),
    pattern: z.string().optional(),
    tagline: z.string().default(""),
    /** 16:9 for a desktop screen, 9:16 for a phone */
    format: z.enum(["landscape", "portrait"]).default("landscape"),
  }),
  views: z.array(ViewDecl),
  sections: z.array(Section).min(1),
});
export type Deck = z.infer<typeof Deck>;
export type DeckInput = z.input<typeof Deck>;
export type MetaInput = z.input<typeof Deck>["meta"];

export const STAGE = {
  landscape: { w: 1920, h: 1080, padTop: 96, padBottom: 150 },
  portrait: { w: 1080, h: 1920, padTop: 122, padBottom: 212 },
} as const;

export const parseDeck = (raw: unknown) => Deck.parse(raw);
export const safeParseDeck = (raw: unknown) => Deck.safeParse(raw);

/** Flat list of every slide, which is what the deck actually steps through. */
export type Cursor = { section: number; slide: number; index: number };
export function flatten(deck: Deck): Cursor[] {
  const out: Cursor[] = [];
  deck.sections.forEach((s, si) => s.slides.forEach((_, ti) => out.push({ section: si, slide: ti, index: out.length })));
  return out;
}
