import { z } from "zod";
import { Op } from "./ops";
import { ViewDecl } from "./views";

export const SCHEMA_VERSION = 1;

/** One moment in time. Every op inside a step animates simultaneously. */
export const Step = z.object({
  beats: z.number().min(0.25).max(24).default(1),
  ops: z.array(Op).default([]),
  label: z.string().optional().describe("what this step DOES, stated as a step — not narration. Voiceover-independent."),
  voice: z.string().optional().describe("what to SAY over this step. Conversational, personified. Exported as the VO script."),
  code: z.object({ view: z.string(), lines: z.array(z.number()) }).optional(),
});
export type Step = z.infer<typeof Step>;

/** Where a view sits on screen. Grid is 12 cols; rows are fractions of stage height. */
export const Pane = z.object({
  view: z.string(),
  col: z.number().min(0).max(12).default(0),
  span: z.number().min(1).max(12).default(12),
  row: z.number().default(0),
  rowSpan: z.number().default(1),
  scale: z.number().default(1),
});
export type Pane = z.infer<typeof Pane>;

export const SceneKind = z.enum([
  "hook", "problem", "brute", "insight", "walkthrough", "complexity", "outro", "custom",
]);

export const Scene = z.object({
  id: z.string(),
  kind: SceneKind,
  title: z.string().optional(),
  layout: z.array(Pane).default([]),
  rows: z.number().default(1).describe("how many layout rows this scene uses"),
  rowSizes: z.array(z.number()).optional().describe("relative height per row, e.g. [0.7,0.7,1.6]; defaults to equal"),
  voice: z.string().optional().describe("narration script for this scene"),
  steps: z.array(Step).min(1),
  transition: z.enum(["cut", "wipe", "fade", "slide"]).default("wipe"),
});
export type Scene = z.infer<typeof Scene>;

export const Storyboard = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  meta: z.object({
    slug: z.string(),
    number: z.number().optional(),
    title: z.string(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Easy"),
    pattern: z.string().optional(),
    fps: z.number().default(30),
    width: z.number().default(1080),
    height: z.number().default(1920),
    framesPerBeat: z.number().default(10),
    /** draw step labels on screen; turn off for a clean plate */
    showSteps: z.boolean().default(true),
    /** the cheeky one-liner for the social caption, e.g. "before anyone catches them" */
    tagline: z.string().default(""),
  }),
  views: z.array(ViewDecl),
  scenes: z.array(Scene).min(1),
});
export type Storyboard = z.infer<typeof Storyboard>;

/** What an author writes: fields with defaults are optional. Traces use this. */
export type MetaInput = z.input<typeof Storyboard>["meta"];
export type StoryboardInput = z.input<typeof Storyboard>;

export const parseStoryboard = (raw: unknown) => Storyboard.parse(raw);
export const safeParseStoryboard = (raw: unknown) => Storyboard.safeParse(raw);
