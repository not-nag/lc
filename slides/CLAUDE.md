# LeetCode Slides

**This project's job: turn a LeetCode problem into a self-paced slide deck in the browser.**

No video, no Remotion, no timing. A slide lasts until the presenter clicks. The author
screen-records themselves clicking through while narrating.

## Do this

```bash
# 1. write traces/<slug>.ts — the real algorithm, instrumented with the t.* tracer
npm run decks                 # 2. compile + validate → decks/<slug>.json
npm run dev                   # 3. localhost:3100
```

Read **HOUSE-STYLE.md** before writing a trace. `traces/two-sum.ts` is the reference.

**Look at a slide before saying it works.** Open the deck and screenshot it — typechecks
don't catch overlap, clipping, or invisible text.

## The model

```
Deck → sections → slides
```

A **section** fixes what's on screen (`show: ["nums", ["seen","v"], "code"]`).
A **slide** is one click: the ops that fire together, plus the on-screen `label` and the
presenter `note`. There is no duration anywhere.

`t.slide("label")` commits a slide. `t.say("…")` attaches the presenter note.
`t.hold("label")` is a slide that changes nothing — a pause to talk over.

## Editing belongs to the author

The `label` on any slide is click-to-edit in the browser; notes are edited in the side panel.
Edits autosave to `decks/<slug>.json` and set `edited: true`, after which **`npm run decks`
refuses to regenerate that deck** — it would wipe the wording. Use `--force` only when the
author explicitly asks to throw their edits away.

So: generate once, then **patch the JSON, never regenerate the trace**.

## Inserting slides

State is a pure fold, so an inserted slide inherits whatever came before it.
- A blank slide anywhere = a pause. Safe.
- A callout / aside / highlight slide = safe anywhere.
- A slide with `structural: true` advances the algorithm — everything after depends on it,
  so it cannot be reordered. The slide list marks these with ⚙.

## The one rule that matters most

**Find the invariant and draw it.** Every algorithm worth a deck has one quantity that only
moves one way — that IS the intuition, and it needs a persistent object on screen for the
whole walkthrough. `bar.level()` for a running minimum, `bar.area()` for a shrinking width,
`a.window()` for a region you've already covered.

**One change per slide.** If the cursor moves *and* a value updates *and* a region grows in
one click, causality is lost. Split it.

## Architecture

| path | what it is |
|---|---|
| `src/schema` | zod op union, view declarations, deck envelope, semantic lint |
| `src/engine` | `reduce.ts` folds ops into state; `anim.ts` is spring/easing without Remotion |
| `src/views` | one renderer per data structure; `registry.tsx` maps kind → component |
| `src/deck` | `useDeck` (position, transition, auto-advance), `Deck`, `SlideView` |
| `src/tracer` | the `t.*` API traces are written against |
| `traces/` | the decks, as code |

**Every op is a pure `reduce(state, op) → state`.** `cachedDeckStates(deck)` is the whole
timeline; slide *i* renders by interpolating `states[i] → states[i+1]` with `t`. No `useState`
in any view. Don't break this.

## Gotchas already paid for

- **`transform: scale()` does not shrink layout size.** The 1080×1920 stage needs a wrapper
  sized `W*scale × H*scale` with the inner div at `transformOrigin: "top left"`.
- **Measure boxes defensively** — a `flex:1` container reports 0×0 before first layout, which
  silently scaled the stage to nothing.
- **Tracer handles must not alias view declarations.** `t.list()` once shared node objects
  with its declaration, so `relink()` mutated the initial state.
- **`t.say()` appends.** Two calls on one slide concatenate. Build one line, say it once.
- **SVG markers scale with `strokeWidth`** — use `markerUnits="userSpaceOnUse"`.
- **Barrel re-exports fail under tsx** in scripts; import from the module file directly.
- **TypeScript pinned to 5.x.** TS 7 breaks Next's config loader.
