# LeetCode in 100 Seconds

**This repo's job: turn a LeetCode problem into a short vertical video. That's it.**

The ask is always some version of *"make a video for LeetCode N"*. Whatever comes with it —
a script, a note about spacing, a preferred example — use it. If nothing comes with it, decide
everything yourself. Never make the user specify what they didn't bring up.

Videos are silent by design. The author records audio separately against the finished video.

## Do this

```bash
# 1. write traces/<slug>.ts   — the real algorithm, instrumented with the t.* tracer
npm run traces                # 2. compile + validate → storyboards/<slug>.json
npm run render -- <slug>      # 3. renders/<slug>.mp4  + .vo.txt (timed script) + .post.txt (caption)
```

Read **HOUSE-STYLE.md** before writing a trace — structure, pacing, voice, and the full tracer
API. `traces/container-with-most-water.ts` and `traces/move-zeroes.ts` are reference quality.

**Look at a frame before saying it works.** Typechecks don't catch overlap, clipping or
invisible text:

```bash
npx remotion still src/remotion/index.ts <slug> out.png --frame=N
npm run frames -- <any-video.mp4>      # stills from a video, to look at
```

**Check exit codes, not echoes.** `render ... && echo OK` reports the echo, not the render.
Confirm output file timestamps changed.

## If the user brings extra

| they give you | what to do |
|---|---|
| a script or transcript | save to `narration/<slug>.txt`, one spoken line per line, and make every `t.say()` a verbatim line from it. `npm run traces` fails with a diff if you reworded them. Their line breaks are their beats — keep them. |
| spacing / layout notes | `show` handles layout automatically; use `layout`/`rows`/`rowSizes` to override. |
| nothing | write the narration and pick the example yourself. |

## Layout

```js
t.scene("walkthrough", { show: ["nums", ["seen", "v"], "code"] });
```

One row per entry, top to bottom; nest ids to sit side by side. Row heights come from what each
view needs — a 16-line code pane asks for more than a row of vars pills. **Do not hand-tune
`rowSizes`** unless the user asked for specific spacing.

## The one rule that matters most

**Find the invariant and draw it.** Every algorithm worth a video has one quantity that only
moves one way — that IS the intuition, and it must be a persistent object on screen for the
whole walkthrough. `bar.level()` for a running minimum, `bar.area()` for a shrinking width,
`a.window()` for a sliding window. Decide what it is before writing any beats.

## Architecture

| path | what it is |
|---|---|
| `src/schema` | zod op union, view declarations, storyboard envelope, semantic linter |
| `src/engine` | `reduce.ts` folds ops into state; `compile.ts` turns beats into frames |
| `src/views` | one renderer per data structure; `registry.tsx` maps kind → component |
| `src/tracer` | the `t.*` API traces are written against |
| `src/remotion` | `Video.tsx` turns a storyboard into `<Sequence>`s |
| `traces/` | the videos, as code |

**Every op is a pure `reduce(state, op) → state`,** so any frame is a fold of the ops before it
and compositions hold no `useState`. Don't break this.

Adding a data structure is additive: view type in `schema/views.ts`, ops in `schema/ops.ts`,
reducer cases in `engine/reduce.ts` + `engine/state.ts`, renderer in `views/`, handle in
`tracer/tracer.ts`, and its line in the tracer API section of `HOUSE-STYLE.md`.

## Gotchas already paid for

- **Tracer handles must not alias view declarations.** `t.list()` once shared node objects with
  its declaration, so `relink()` mutated frame 0 and every frame showed the final state.
- **`t.say()` appends.** Two calls on one beat concatenate. Build one line, say it once.
- **SVG markers scale with `strokeWidth`** — use `markerUnits="userSpaceOnUse"`.
- **TypeScript pinned to 5.x.** TS 7 breaks Next's config loader.
- **Remotion ignores tsconfig paths** — `@/` is aliased in `remotion.config.ts`.
- **Don't `rm -rf .next` or `next build` while the dev server runs** — it serves broken 500s
  until restarted.
