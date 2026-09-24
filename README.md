# LeetCode in 100 Seconds

Generate short vertical algorithm explainer videos from a LeetCode problem number.

```
problem number → LLM writes an instrumented solution → running it emits the animation
              → validated storyboard JSON → Remotion → MP4
```

The model never writes React or Remotion code. It writes a working solution against a
tracer API; every call is recorded as an animation op. **Because the real algorithm
executes, the animation cannot disagree with it.**

---

**Internal tool.** Generation happens from the terminal (or by asking Claude Code with this
repo as context). The website is only a gallery of what has been made.

**Writing a video?** Read [HOUSE-STYLE.md](HOUSE-STYLE.md) — structure, pacing, narration voice
and the full tracer API. [CLAUDE.md](CLAUDE.md) is the orientation for an AI session.

## Quick start

```bash
npm install
npm run traces      # compile traces/*.ts → storyboards/*.json
npm run render -- two-sum
npm run dev         # gallery at localhost:3000
npm run studio      # Remotion Studio, for scrubbing a composition frame by frame
```

Two ways to make a new video:

**Ask Claude Code** — "make a video for LeetCode 121", with this repo as context. It writes
`traces/<slug>.ts`, runs `npm run traces`, and you render it. This is the main path.

**Or the CLI**, which does the same thing unattended:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run generate -- 121
```

---

## How it fits together

| Layer | Path | What it does |
|---|---|---|
| **Schema** | `src/schema` | zod types for the op union, view declarations, storyboard envelope, plus a semantic linter |
| **Engine** | `src/engine` | folds ops into state, compiles beats → frames, tweens between steps |
| **Views** | `src/views` | one renderer per data structure; `registry.tsx` maps kind → component |
| **Primitives** | `src/primitives` | Stage, Cell, Pointer, Bracket, Caption, Callout, CodePane, TitleCard |
| **Tracer** | `src/tracer` | the `t.*` API and a sandboxed runner for model-written code |
| **Remotion** | `src/remotion` | `Video.tsx` turns a storyboard into `<Sequence>`s; every storyboard auto-registers |
| **Generator** | `src/generator` | prompt, few-shot selection, generate → validate → repair loop |
| **Web** | `app/` | Gallery of rendered videos, plus a per-video preview/edit page |

### The load-bearing rule

Every op is a pure `reduce(state, op) → state`, so any frame is

```
stateAt(frame) = ops.slice(0, stepAt(frame)).reduce(apply, initial)
visual         = interpolate(stateAt(step), stateAt(step + 1), spring)
```

No `useState` in any composition. Scrubbing, deterministic renders and parallel
rendering all follow from that.

---

## Adding a data structure

Purely additive — nothing existing changes:

1. Add the view type in `src/schema/views.ts`.
2. Add its ops to the union in `src/schema/ops.ts`.
3. Add reducer cases in `src/engine/reduce.ts` and an init case in `src/engine/state.ts`.
4. Write the renderer in `src/views/` and register it in `src/views/registry.tsx`.
5. Add a handle in `src/tracer/tracer.ts` and document it in `src/generator/tracer-api.ts`.

For a genuine one-off that resists the reduce contract, use the escape hatch instead:

```ts
{ type: "custom", component: "BinaryBitsPanel", props: { ... } }
```

resolved against `registerCustom()` in the view registry.

---

## Step labels, not narration

The text on screen states **what the algorithm does**, in the algorithm's own language:

```
WRONG (narration)          RIGHT (step)
"We'd need 7."             "need = 9 − 2 = 7"
"So we store it."          "seen[2] = 0"
"That's too slow."         "n(n−1)/2 pairs  →  O(n²)"
```

This keeps the video voiceover-independent: record any commentary you like and the
on-screen text never contradicts it. Set `meta.showSteps: false` for a clean plate.

`npm run render` also writes `renders/<slug>.vo.txt` — the narration with timestamps, to
record against — and `renders/<slug>.post.txt`, the social caption.

Videos are silent by design; audio is added separately after the cut is final.

## Script-first: your words, generated visuals

AI-written narration has generic taste. Write the script yourself and let the generator do only
the mechanical part — deciding what is on screen while each line is spoken.

```bash
narration/<slug>.txt     # one spoken line per line; # comments ignored
npm run traces           # FAILS if the trace reworded, reordered or dropped any line
```

The check is mechanical, not advisory: it prints a line-by-line diff of script vs trace and
refuses to build. `traces/move-zeroes.ts` is the reference example.


## Humour

`t.aside("Fine for 5 numbers. Less fine for 10,000.")` renders a small wry margin note,
visually separate from the teaching so a joke never reads as an instruction. Dry
understatement only, 1–3 per video, never inside the walkthrough.

## Timing

`framesPerBeat: 10` at 30fps → **1 beat = 0.33s**. Mechanical steps take 1–2 beats,
explanatory steps 3–5.

A step is never shorter than its label takes to read (17 chars/sec, clamped to
0.85–2.8s). That floor lives in `compile()`, so neither you nor the model can
produce unreadable pacing by asking for speed.

---

## The generation loop

1. Fetch the problem from LeetCode (cached in `.cache/problems`).
2. Classify it into a pattern from its topic tags → pick the closest few-shot examples.
3. Model writes a tracer script.
4. Run it in a forked process with a vm and a wall-clock kill.
5. Parse with zod, then lint semantically: unknown view ids, out-of-range indices,
   pointers moved before being set, pops on empty, code lines past EOF, runtime budget.
6. On failure, hand the model the exact errors and retry (max 2 rounds).

**Approved traces are the few-shot library.** Quality compounds: the twentieth problem
generates better than the first because the model sees prior examples of the same
pattern with your approved pacing.

### Iterate by patching, not regenerating

Edit `traces/<slug>.ts` (best — it stays the few-shot example) or tweak
`storyboards/<slug>.json` in the studio page. Regenerating throws away tweaks and
reintroduces bugs you already fixed.

---

## Checked-in traces

| # | Problem | Pattern | Views exercised |
|---|---|---|---|
| 1 | Two Sum | hashmap-one-pass | array, map, vars, code |
| 3 | Longest Substring Without Repeating | sliding-window | string, window, map, vars |
| 20 | Valid Parentheses | stack | string, stack, vars |
| 200 | Number of Islands | grid | grid, cursor, stack |
| 206 | Reverse Linked List | linked-list | list, relink |
| 207 | Course Schedule | topological-sort | graph, queue, vars |
| 226 | Invert Binary Tree | tree-dfs | tree, recursion |

---

## Notes

- Output is 1080×1920 @ 30fps. A 16:9 variant is a layout change, not a rewrite.
- `schemaVersion` is on every storyboard — add a `migrate()` chain before renaming ops.
- Rendering is local (`npx remotion render`). Move to Lambda when volume justifies it.
- LeetCode content is fetched from their public GraphQL endpoint for your own use.
- Remotion is free for individuals and small teams but **some companies need a paid
  licence** — see https://remotion.dev/license.
