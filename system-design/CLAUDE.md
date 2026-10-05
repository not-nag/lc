# System Design Slides

**This project's job: turn a system design topic into a self-paced slide deck in the browser.**

Same engine as `../slides` (the LeetCode decks), different subject. No video, no timing — a
slide lasts until the presenter clicks. The author screen-records themselves clicking through.

## Do this

```bash
# 1. write traces/<slug>.ts — the design, built up one box at a time with the t.* tracer
npm run decks                 # 2. compile + validate → decks/<slug>.json
npm run dev                   # 3. localhost:3200  (the LeetCode decks use 3100; both can run)
```

Read **HOUSE-STYLE.md** before writing a trace — structure, voice, and the full tracer API.
`traces/url-shortener.ts` is the reference.

**Look at a slide before saying it works.** Open the deck and screenshot it; typechecks don't
catch overlap, clipping, or invisible text. Wait for the 480ms transition to settle before
judging a screenshot — a half-faded marker is `t < 1`, not a bug.

## The model

```
Deck → sections → slides
```

A **section** fixes what's on screen (`show: ["arch", "load"]`). A **slide** is one click: the
ops that fire together, plus the on-screen `label` and the presenter `note`. No durations.

`t.slide("label")` commits a slide. `t.say("…")` attaches the presenter note.
`t.hold("label")` is a slide that changes nothing — a pause to talk over.

## What the author controls in the browser

Exactly two things: **the text shown at the bottom of a slide** and **deleting a slide**.
Everything else comes from the trace and changes by asking.

Edits autosave to `decks/<slug>.json` and set `edited: true`, after which **`npm run decks`
refuses to regenerate that deck**. Use `--force` only when the author explicitly asks to throw
their edits away. So: generate once, then **patch the JSON, never regenerate the trace**.

## Presenting

Arrow keys or space to advance, `R` replay, `A` auto-advance, `F` fullscreen (slide only).

## The rule that matters most

**Every architecture change answers a specific bottleneck. Show the bottleneck before the fix.**

Never present a finished architecture. Start with the simplest thing that works, show precisely
what breaks and why — with a number on it — then add exactly one component to fix it. The
bottleneck marker (`s.bottleneck`) is the persistent object on screen, the way the running
minimum was in #121: there is one, and it moves.

- **One change per slide.** One box (with the arrow that connects it), one arrow, or one number.
- **Never show the final diagram up front.** Architecture views are declared empty and only
  grow through ops; the linter rejects an architecture view in a hook/problem/estimate section.
- **Every component must be earned.** After the first bottleneck, a box or a replica increase
  that doesn't follow an unanswered `s.bottleneck` fails the build.
- **Numbers before boxes.** A bottleneck with no digit in it is a lint warning. Compute every
  figure in the trace from stated assumptions (`si`, `rate`, `bytes`) — never type a result.

## Typography

Slide prose uses the display face (Bricolage Grotesque). Mono is for figures, specs, and
expressions — a label containing `= ÷ × ≈ < >` or ` - ` renders mono automatically. **No
ALL-CAPS labels**; the difficulty pill is the one exception.

## Architecture

| path | what it is |
|---|---|
| `src/schema` | zod op union, view declarations, deck envelope, lint (referential + house rules) |
| `src/engine` | `reduce.ts` folds ops into state; `anim.ts` is spring/easing, no dependencies |
| `src/views` | `ArchView` (+ `archLayout.ts`), `NumbersView`, `CompareView`, `CodeTextView`; `registry.tsx` |
| `src/deck` | `useDeck` (position, transition, auto-advance), `Deck`, `SlideView` — unchanged from slides |
| `src/tracer` | the `t.*` API traces are written against, plus `si`/`rate`/`bytes` formatters |
| `traces/` | the decks, as code |

**Every op is a pure `reduce(state, op) → state`.** `cachedDeckStates(deck)` is the whole
timeline; slide *i* renders by interpolating `states[i] → states[i+1]` with `t`. No `useState`
in any view. Don't break this.

Things that are *derived* in the renderer, not stored: box positions (layout of the current
node set, lerped prev → next), which arrows a request token has lit (from its path and `at`),
and the resolved ✓ (shown only while `resolved.born === slideIndex`).

Adding a view is additive: view type in `schema/views.ts`, ops in `schema/ops.ts`, reducer
cases in `engine/reduce.ts` + `engine/state.ts`, renderer in `views/`, handle in
`tracer/tracer.ts`, lint cases in `schema/lint.ts`, and its line in `HOUSE-STYLE.md`.

## Gotchas already paid for

- **`transform: scale()` does not shrink layout size.** The stage needs a wrapper sized
  `W*scale × H*scale` with the inner div at `transformOrigin: "top left"`.
- **Measure boxes defensively** — a `flex:1` container reports 0×0 before first layout.
- **Z-index:** anything with a z-index beats a later sibling with `z-index: auto`. Overlays 25,
  result banner 40, step label 50.
- **Fullscreen has two white surfaces**: `:fullscreen` and `::backdrop`. Both are `var(--paper)`.
- **Tracer handles must not alias view declarations.** `SystemHandle` keeps its own mirror of
  nodes/edges; the architecture declaration is empty and must stay that way (frame 0).
- **`t.say()` appends.** Build one line, say it once.
- **SVG markers scale with `strokeWidth`** — use `markerUnits="userSpaceOnUse"`. Marker ids are
  prefixed with `useId()` so two diagrams on a page can't steal each other's arrowheads.
- **`Panel` pads its child by 8px a side.** A view that sizes itself to its pane height must
  subtract that, or its bottom row clips.
- **A flex child with `overflow: hidden` shrinks instead of pushing its parent** — that's how
  the numbers-card note got cut to half a line. Give text rows `flexShrink: 0`.
- **Replica badges sit bottom-left** of the stack; top-right collided with the bottleneck pill
  and with arrows leaving the right edge.
- **Barrel re-exports fail under tsx** in scripts; traces import from `@/tracer/tracer` directly.
- **TypeScript pinned to 5.x.** TS 7 breaks Next's config loader.
- **Never touch `.next` while the dev server runs.** Use `npm run reset` (kills only port 3200).
- **Landscape is short on height, not width.** A diagram is wide, so the numbers go in a strip
  *under* it (`show: ["arch", "load"]`); a spec and a numbers column go side by side.
- **Panes clip their content**, so an overcrowded section looks cropped, not subtly wrong.
