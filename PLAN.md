# LeetCode in 100 Seconds — Visualiser Engine

## Goal
`Problem + Solution → LLM → Storyboard (JSON) → Visualiser components → Remotion → MP4`

The LLM never writes React or Remotion code. It emits **data** against a fixed,
validated vocabulary. Everything visual is a reusable component we own.

---

## 1. The core abstraction: the Op vocabulary

Three layers, strictly separated:

| Layer | What it is | Who writes it |
|---|---|---|
| **Views** | Data-structure renderers (Array, Grid, Tree, HashMap…) | us, once |
| **Ops** | Typed mutations on a view (`array.swap`, `pointer.move`) | LLM, per problem |
| **Engine** | Folds ops → state at frame N, tweens between steps | us, once |

### Storyboard shape

```ts
Storyboard {
  meta:   { slug, title, difficulty, fps: 30, w: 1080, h: 1920 }
  views:  Record<ViewId, ViewDecl>        // declare once: { kind:'array', id:'nums', data:[2,7,11,15] }
  scenes: Scene[]
}

Scene {
  kind:    'hook'|'problem'|'brute'|'insight'|'walkthrough'|'complexity'|'outro'
  layout:  PaneSpec[]                     // which views on screen, where, how big
  voice?:  string                         // narration / TTS + burned-in subtitles
  steps:   Step[]
}

Step {
  beats:    number                        // 1 beat = 10 frames = 0.33s
  ops:      Op[]
  caption?: string
  code?:    { lines: number[] }           // highlight in the CodePane
}
```

### Op union (discriminated on `type`)

```
array.highlight   { view, indices, style: compare|active|match|window|done|dim }
array.swap        { view, a, b }                 // arc tween
array.setValue    { view, index, value }         // flip + count-up
array.slice       { view, from, to, label }      // window bracket
pointer.set|move  { view, name:'i', index, color }
pointer.drop      { view, name }
hashmap.put       { view, key, value }
hashmap.lookup    { view, key, hit: boolean }
stack.push|pop    { view, value }
queue.enqueue|dequeue
list.focus        { view, nodeId }               // linked list
list.relink       { view, from, to }             // pointer rewiring
tree.visit        { view, nodeId, phase: pre|in|post }
tree.mark         { view, nodeId, style }
graph.traverse    { view, edge:[a,b] }
grid.paint        { view, cells:[[r,c]], style }
callout           { text, anchor:{view,index}, variant: insight|warn|math }
formula           { text: 'target - nums[i] = 7' }
result.reveal     { value }
camera.focus      { view, indices }              // subtle push/pan
```

Every op has a **reducer** (state after) and a **tween** (how it looks mid-flight).
Adding a new data structure = one View + its ops + reducers. Nothing else changes.

### Why "state at frame" not imperative animation
```
stateAt(frame) = ops.slice(0, stepIndexAt(frame)).reduce(apply, initial)
visual = interpolate(stateAt(step), stateAt(step+1), springProgress)
```
Pure function of frame → Remotion scrubbing, parallel rendering, and deterministic
output all work for free. No `useState` anywhere in the compositions.

---

## 2. How the LLM actually produces a storyboard

**Primary path — trace, don't transcribe.** Asking a model to hand-write 80 ops is
slow and drifts from the real algorithm. Instead the model writes ~30 lines of the
solution instrumented with a tracer that *is* the op vocabulary:

```js
const nums = t.array('nums', [2,7,11,15]);
const seen = t.map('seen');
for (let i = 0; i < nums.length; i++) {
  t.pointer('i', i);                      t.beat();
  const need = target - nums[i];
  t.formula(`${target} - ${nums[i]} = ${need}`);  t.beat();
  if (seen.has(need)) { t.hit(need); t.result([seen.get(need), i]); break; }
  seen.put(nums[i], i);                   t.beat();
}
```

Run it in a sandboxed worker → capture the op log → storyboard. The animation is
then **guaranteed** to match real execution. The model only invents pacing and words.

**Fallback path** — raw JSON storyboard, for conceptual scenes (hook, insight,
complexity) that have no execution to trace.

**Validation loop** (non-negotiable): zod parse → semantic lint (view ids exist,
indices in range, pointers declared before moved, beats within budget, revealed
result equals the real answer) → on failure, re-prompt with the exact errors. Max 2 repairs.

---

## 3. Look & pacing

**Palette — earthy / warm**
```
bg       #F2E4D5   linen        surface  #EADBC8
ink      #3E2C23   dark brown   muted    #7A5C47
terracotta #C1663F (primary)    olive    #6B7A4B (secondary)
mustard  #D9A441 (attention)    clay     #A2452F (negative/miss)
sage     #5C8A4A (match/success)
```
Type: display grotesque for titles, **JetBrains Mono for cells + code** (digits must
be tabular so cells don't jitter).

**Pacing for short attention spans**
- 1 beat = 10 frames @30fps. Most steps are 1 beat.
- Springs: `{ damping: 14, stiffness: 220, mass: 0.6 }` — arrives fast, tiny overshoot.
- No dead air. Hard cuts between scenes + 6-frame wipe.
- Scene budget for a 90s video: hook 5s · problem 10s · brute force 15s · insight 10s ·
  walkthrough 40s · complexity 7s · outro 3s.
- Audio hooks per op: tick (pointer), thunk (swap), chime (match), whoosh (scene cut).
- Subtle camera push on `camera.focus` — movement keeps the eye locked.

Format: 1080×1920 vertical, 30fps. A 16:9 variant is a layout swap, not a rewrite.

---

## 4. Repo layout

```
LC/
  app/                        Next.js 15 studio (App Router)
    page.tsx                  paste problem + solution
    studio/[slug]/page.tsx    @remotion/player preview + JSON editor
    api/generate/route.ts     LLM → storyboard
    api/render/route.ts       Remotion render trigger
  src/
    schema/                   zod Op union + Storyboard; exports JSON Schema for the prompt
    theme/                    palette, type scale, motion constants, sfx map
    engine/
      compile.ts              beats → frame ranges, scene sequencing
      reduce.ts               op → state reducers per view kind
      tween.ts                interpolators + spring presets
    views/                    ArrayView, GridView, HashMapView, StringView,
                              StackView, QueueView, LinkedListView, TreeView, GraphView
    primitives/               Stage, Pane, Cell, Pointer, Arrow, Badge, Callout,
                              Caption, CodePane, TitleCard, Counter, Bracket
    tracer/                   the t.* API + sandboxed runner → op log
    remotion/
      Root.tsx                composition registry
      Video.tsx               Storyboard → <Sequence> tree
  storyboards/                checked-in JSON — also the few-shot library for the LLM
```

Single app, no monorepo. Split into packages only if a second consumer appears.

---

## 5. Build order

| Phase | Deliverable | Proof it works |
|---|---|---|
| **0** | Next 15 + Remotion 4 + Tailwind + zod scaffold, theme tokens, Studio boots | blank earthy stage renders |
| **1** | Primitives: Stage, Pane, Cell, Pointer, Caption, CodePane, TitleCard, Callout | storybook-ish demo composition |
| **2** | **Engine + ArrayView + full array/pointer/hashmap ops** | **Two Sum, hand-written JSON, renders to MP4** |
| **3** | Scene sequencer, transitions, subtitles, sfx, camera | full 90s Two Sum with narration |
| **4** | StringView, GridView, StackView, QueueView | Valid Parentheses, Number of Islands |
| **5** | LinkedListView, TreeView (d3-hierarchy), GraphView | Reverse List, Invert Tree, Course Schedule |
| **6** | Studio UI: paste → preview → edit JSON → render | end-to-end without touching code |
| **7** | Generator: prompt + tracer + validate/repair loop | unseen problem → watchable video |

Phase 2 is the real milestone — it locks the engine contract. Phases 4–5 after that
are mechanical: each new view is additive and touches nothing existing.

---

## 6. Decisions taken (change if you disagree)
- **Vertical 1080×1920 @30fps** — Shorts/Reels first.
- **Local `remotion render` for now**, Lambda later when volume justifies it.
- **Tracer-first generation**, JSON fallback for non-executable scenes.
- **Storyboards checked into git** — they double as regression fixtures and few-shot examples.

---

## 7. Generation & iteration workflow

One JSON per question, checked into `storyboards/<slug>.json`. That file is the
source of truth: diffable, reviewable, re-renderable, and it doubles as a
regression fixture and a few-shot example. Confirmed.

But **don't generate 90 seconds of JSON in one LLM call.** Long single-shot
generation drifts, miscounts indices, and forces a full regenerate for every small
fix. Split by determinism — let the model do the least mechanical work possible.

### Three tiers, most deterministic first

**Tier 1 — Pattern template (code, not LLM).**
LeetCode collapses into ~15 patterns: two pointers, sliding window, hashmap
one-pass, binary search, monotonic stack, BFS/DFS grid, tree DFS, topological sort,
backtracking, DP table, heap, intervals, prefix sum, linked-list pointers, union-find.
Each gets a parameterised storyboard skeleton: scene order, pane layout, beat budget,
which views appear when. A classifier picks the pattern; the skeleton is filled.
This is where series-wide visual consistency comes from — and it's free, no tokens.

**Tier 2 — Tracer (execution, not LLM).**
The walkthrough scene — the 40s that carries the video — comes from running the
instrumented solution and capturing the op log. Deterministic, always correct,
never hallucinates an index.

**Tier 3 — LLM free-form (small surface).**
Only what genuinely needs judgement: the hook line, how the brute force is framed,
the insight scene, captions, narration, complexity wording. Maybe 15% of the ops.

So the model writes ~30 lines of instrumented solution + a few hundred words of
copy. It never hand-counts 80 animation steps.

### The iteration loop

```
generate → preview (@remotion/player, hot-reloads on JSON save) → patch → re-render
```

Rule: **patch, never regenerate.** Fixes are JSON Patch ops against the current
storyboard ("slow scene 4 to 2 beats per step", "add a callout at nums[3]"), applied
by hand in the editor or by the model. Regenerating throws away every manual tweak
you made and reintroduces bugs you already fixed.

### Quality compounds
Every approved storyboard joins the few-shot library, indexed by pattern. Question 20
generates noticeably better than question 1 because the model is now seeing three
prior examples *of the same pattern* with human-approved pacing.

### Realistic expectation
Early videos: expect 20–30 min of hand-editing each. That's fine and it's the point —
those edits are the training signal. Target after ~15 questions is generate + 5 min
of pacing tweaks.

---

## 8. What's locked vs what we add later

Extending the vocabulary later is safe **if** we freeze the envelope now and version
from the first commit.

### Freeze now — expensive to change
- `Storyboard / Scene / Step` envelope shape
- Beat-based timing (1 beat = 10 frames), beats never absolute frames
- Ops are a discriminated union on `type`, always targeting a view by `id`
- **Every op is a pure `reduce(state, op) → state`** — this is the load-bearing contract
- `schemaVersion` on every storyboard, from commit #1

### Add freely — purely additive, breaks nothing
- New op types, new view kinds, new style enum values
- Layout/pane options, camera moves, audio, transitions
- Anything in the Tier-1 pattern library

### Migrations
`schemaVersion` + a `migrate(storyboard)` chain means a vocabulary change never
invalidates the storyboards already shipped. Renaming `array.highlight` in month
three is a 10-line migration, not 40 broken videos.

### Escape hatch
Some visual will eventually resist the pure-reduce contract (free-form geometry, a
one-off bespoke scene). Rather than bending the engine:

```ts
{ type: 'custom', component: 'BinaryBitsPanel', props: {...} }
```

Resolved against a component registry. The contract stays intact, the weird case
still ships, and if a `custom` component gets used three times it graduates into a
real view.
