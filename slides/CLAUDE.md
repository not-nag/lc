# LeetCode Slides

**This repo's job: turn a LeetCode problem into a self-paced slide deck in the browser.**

No video, no rendering, no timing. A slide lasts until the presenter clicks. The author
screen-records themselves clicking through while narrating.

## Do this

```bash
# 1. write traces/<slug>.ts — the real algorithm, instrumented with the t.* tracer
npm run decks                 # 2. compile + validate → decks/<slug>.json
npm run dev                   # 3. localhost:3100
```

Read **HOUSE-STYLE.md** before writing a trace — structure, voice, and the full tracer API.
`traces/two-sum.ts` is the reference.

**Look at a slide before saying it works.** Open the deck and screenshot it; typechecks don't
catch overlap, clipping, or invisible text.

## The model

```
Deck → sections → slides
```

A **section** fixes what's on screen (`show: ["nums", ["seen","v"], "code"]`).
A **slide** is one click: the ops that fire together, plus the on-screen `label` and the
presenter `note`. There is no duration anywhere.

`t.slide("label")` commits a slide. `t.say("…")` attaches the presenter note.
`t.hold("label")` is a slide that changes nothing — a pause to talk over.

## What the author controls in the browser

Exactly two things: **the text shown at the bottom of a slide** (a textarea; empty shows
nothing) and **deleting a slide**. Everything else comes from the trace and changes by asking.

Edits autosave to `decks/<slug>.json` and set `edited: true`, after which **`npm run decks`
refuses to regenerate that deck**. Use `--force` only when the author explicitly asks to throw
their edits away. So: generate once, then **patch the JSON, never regenerate the trace**.

There is no undo. `npm run decks -- --force` restores a deck and discards every edit.

## Presenting

Arrow keys or space to advance, `R` to replay a transition, `A` to toggle auto-advance,
`F` for fullscreen — which hides every control and shows only the slide.

## The rules that matter most

**Find the invariant and draw it.** Every algorithm worth a deck has one quantity that only
moves one way — that IS the intuition, and it needs a persistent object on screen for the whole
walkthrough. `bar.level()` for a running minimum, `bar.area()` for a shrinking width,
`a.window()` for a region already covered.

**One change per slide.** If the cursor moves *and* a value updates *and* a region grows on one
click, causality is lost. Split it.

**Never show the answer before the walkthrough.** The problem section poses the question and
stops.

**Don't editorialise about what the algorithm can't do.** A value not yet reached isn't
"unusable" — it simply hasn't been stored, and the walk usually arrives there anyway.

## Typography

Slide prose uses the display face (Bricolage Grotesque) via `displayFamily`. Mono is reserved
for cell values, code, and expressions, where tabular figures matter. **No ALL-CAPS labels** —
header, pane captions and section names are sentence case. The difficulty pill is the one
exception, where caps reads as a badge.

## Architecture

| path | what it is |
|---|---|
| `src/schema` | zod op union, view declarations, deck envelope, semantic lint |
| `src/engine` | `reduce.ts` folds ops into state; `anim.ts` is spring/easing, no dependencies |
| `src/views` | one renderer per data structure; `registry.tsx` maps kind → component |
| `src/deck` | `useDeck` (position, transition, auto-advance), `Deck`, `SlideView` |
| `src/tracer` | the `t.*` API traces are written against |
| `traces/` | the decks, as code |

**Every op is a pure `reduce(state, op) → state`.** `cachedDeckStates(deck)` is the whole
timeline; slide *i* renders by interpolating `states[i] → states[i+1]` with `t`. No `useState`
in any view. Don't break this.

Adding a data structure is additive: view type in `schema/views.ts`, ops in `schema/ops.ts`,
reducer cases in `engine/reduce.ts` + `engine/state.ts`, renderer in `views/`, handle in
`tracer/tracer.ts`, and its line in the tracer API section of `HOUSE-STYLE.md`.

## Gotchas already paid for

- **`transform: scale()` does not shrink layout size.** The stage needs a wrapper sized
  `W*scale × H*scale` with the inner div at `transformOrigin: "top left"`.
- **Measure boxes defensively** — a `flex:1` container reports 0×0 before first layout, which
  silently scaled the stage to nothing.
- **`Cell` sets `z-index: 1`** so a swapping cell passes over its neighbour. Any overlay must
  declare its own z-index or it paints *behind* the cells. Overlays 25, result banner 40,
  step label 50.
- **Fullscreen has two white surfaces**: `:fullscreen` and `::backdrop` both default to white.
  Both use `var(--paper)` in `globals.css`, and the deck root paints `stageBackground` when
  fullscreen so letterboxing matches the slide.
- **Tracer handles must not alias view declarations.** `t.list()` once shared node objects with
  its declaration, so `relink()` mutated the initial state.
- **`t.say()` appends.** Two calls on one slide concatenate. Build one line, say it once.
- **Clear per-cell chips** (`a.tagClear()`) when the cursor moves, or the previous number's tag
  stays pinned to the old cell.
- **SVG markers scale with `strokeWidth`** — use `markerUnits="userSpaceOnUse"`.
- **Barrel re-exports fail under tsx** in scripts; import from the module file directly.
- **TypeScript pinned to 5.x.** TS 7 breaks Next's config loader.
- **Never touch `.next` while the dev server runs** — `rm -rf .next`, `npm run build`, anything.
  Use `npm run reset`, then `npm run dev`.
- **Landscape is short on height, not width.** A tall view (a 9×9 grid, a long code pane)
  should sit *beside* its companion, not above it: `show: [["g", "s"]]`.
- **Panes clip their content** (`overflow: hidden`), so a view that outgrows its pane is cut
  rather than bleeding into the slide label. If something looks cropped, the section is
  showing one thing too many.
- **Prefer anchored string edits over line ranges** when patching files; a line-range splice
  once deleted a whole render block that sat between two blocks being merged.
