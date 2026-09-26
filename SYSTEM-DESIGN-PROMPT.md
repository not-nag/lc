# Prompt: system design slide decks

Paste this into a fresh session. It assumes `LC/slides` exists on the machine as a working
reference; if it doesn't, everything below still specifies the project from scratch.

---

Build me a new project, `system-design/`, that turns a system design topic into a self-paced
slide deck in the browser. Same shape as the LeetCode deck project in `LC/slides`, different
subject matter.

## Start by copying, not from scratch

`LC/slides` already solves ~70% of this. Copy it as the starting point and change only what
the subject demands. Read `LC/slides/CLAUDE.md` and `LC/slides/HOUSE-STYLE.md` first — they
carry a lot of hard-won detail.

**Transfers unchanged:**
- `src/engine/reduce.ts` — every op is a pure `reduce(state, op) → state`; `cachedDeckStates`
  is the whole timeline. Do not break this.
- `src/engine/anim.ts` — spring/easing/lerp, no dependencies.
- `src/deck/` — `useDeck` (position, 480ms transition, auto-advance), `Deck` (scaled 16:9
  stage, keyboard, fullscreen), `SlideView`.
- `src/schema/deck.ts` — `Deck → sections → slides`. A slide is one click. **No durations
  anywhere.** Keep `edited: true` protection and the `show: ["a", ["b","c"]]` auto-layout.
- The studio: a textarea for the bottom line, and a delete button. Nothing else.
- `src/theme` — the warm paper palette works; keep it.
- `scripts/build-decks.mts` and the semantic linter.

**Replace entirely:** `src/views/*` and the tracer handles. That is the actual work.

## The views you need

This is the design problem. Algorithms have arrays and pointers; system design has boxes,
arrows and numbers.

- **architecture** — labelled boxes connected by arrows. Must support: adding a node mid-deck,
  connecting two nodes, highlighting a node or an edge, marking a node as the bottleneck,
  and annotating an edge ("10k QPS"). Lay out by tier (client → edge → service → data) with
  explicit `x`/`y` as the override.
- **flow** — a request token that animates along a path of nodes, so you can trace one request
  end to end across several slides.
- **numbers** — a capacity readout: QPS, storage, bandwidth, replica count. The system-design
  equivalent of the vars panel.
- **compare** — two or three options side by side with their trade-offs, one row per axis.
- **spec** — a short API signature or table schema, mono, highlightable line by line. This is
  the existing `code` view; keep it.
- **text** — prose panels for framing. Keep as is.

## The rule that matters most

In the LeetCode project it was *find the invariant and draw it*. Here it is:

**Every architecture change answers a specific bottleneck. Show the bottleneck before the fix.**

Never present a finished architecture. Start with the simplest thing that works, show precisely
what breaks and why — with a number on it — then add exactly one component to fix it. The
bottleneck marker is the persistent object on screen, the way the running minimum was in #121.

Corollaries:
- **One change per slide.** One box, one arrow, or one number — never three at once.
- **Never show the final diagram up front.** It spoils the reasoning, which is the whole point.
- **Every component must be earned.** If you can't say what breaks without it, cut it.
- **Numbers before boxes.** "500 million reads a day" justifies the cache; the cache alone
  justifies nothing.

## Deck structure

1. **hook** — one line.
2. **problem** — what the system does, and the two or three requirements that will drive every
   later decision. Two or three slides.
3. **estimate** — the numbers. QPS, storage, read/write ratio. This is what makes the rest
   non-arbitrary.
4. **walkthrough** — the bulk. Start naive, break it, fix it, repeat. Each round: show the
   bottleneck, name it, add one thing.
5. **tradeoffs** — where you'd choose differently, and why.
6. **intuition** — the one sentence someone should remember.

## Tracer shape

Declarative, not executed — there is no algorithm to run, so the trace describes the build-up:

```ts
const s = t.system("arch", { label: "architecture" });
s.node("client", "Client", { tier: 0 });
s.node("api", "API Server", { tier: 1 });
s.edge("client", "api", "1k QPS");
t.say("One server handles everything.");
t.slide("one server");

s.bottleneck("api", "CPU at 95%");
t.say("At ten thousand requests a second the single server saturates.");
t.slide("10k QPS  →  one server saturates");
```

Keep `t.section(kind, { show })`, `t.slide(label)`, `t.say(note)`, `t.callout`, `t.aside`,
`t.result`. Add `t.number(...)` for the capacity panel.

## Gotchas inherited — do not rediscover these

- **`transform: scale()` doesn't shrink layout size.** The stage needs a wrapper sized
  `W*scale × H*scale`, inner div at `transformOrigin: "top left"`.
- **A `flex:1` box measures 0×0 before first layout** — guard, or the stage scales to nothing.
- **Anything with a z-index beats a later sibling with `z-index: auto`.** Overlays must declare
  their own layer.
- **Fullscreen paints two white surfaces**: `:fullscreen` and `::backdrop`. Set both.
- **Tracer handles must not alias view declarations** — the handle mutates as the trace runs;
  the declaration must stay the frame-0 state.
- **Landscape is short on height, not width.** Put tall views side by side, not stacked.
- **Panes clip their content**, so an overcrowded section looks cropped, not subtly wrong.
- **Never touch `.next` while the dev server runs.** Ship an `npm run reset`.
- **Pin TypeScript to 5.x** — TS 7 breaks Next's config loader.
- Use port **3200** so it can run alongside the LeetCode decks on 3100.

## Verify visually, always

Typechecks don't catch overlap, clipping or invisible text. After building a deck, open it and
screenshot actual slides before saying it works. Check exit codes, not echoes.

## First deliverable

The project running, plus one complete deck — **design a URL shortener** — as the reference
others are written against. Then tell me what the second one should be.
