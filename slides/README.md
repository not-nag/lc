# LeetCode Slides

Self-paced algorithm decks that run in a browser. Arrow keys to advance, `F` for fullscreen.
Built to be screen-recorded while you narrate.

## Run it

Needs **Node 20+**.

```bash
npm install
npm run decks     # compile traces/*.ts → decks/*.json
npm run dev       # http://localhost:3100
```

## Controls

| key | |
|---|---|
| `→` `space` | next slide |
| `←` | previous |
| `R` | replay the transition |
| `A` | auto-advance on/off |
| `F` | fullscreen — slide only, no controls |

Under the slide: a textarea for the line shown at the bottom, and a delete button.
Edits autosave. Nothing else is editable by hand — the content comes from `traces/`.

## Making a new deck

Write `traces/<slug>.ts`: a real, working implementation of the algorithm, instrumented with
the `t.*` tracer. Running it produces the slides, so the animation can't disagree with the code.

```ts
export const meta: MetaInput = { slug: "two-sum", number: 1, title: "Two Sum", difficulty: "Easy" };

export function trace(t: Tracer) {
  const a = t.array("nums", [3, 5, 7, 2], { label: "nums" });
  t.section("walkthrough", { show: ["a"] });
  a.highlight([0], "active");
  t.say("Start on the first number.");   // presenter note
  t.slide("on 3");                        // the line on screen
}
```

Then `npm run decks`. It validates as it compiles — unknown views, out-of-range indices,
pointers moved before they're set, and code-highlight lines past the end of the snippet all
fail the build.

**Read `HOUSE-STYLE.md` first.** It covers structure, the tracer API, and the rules that make
a deck teach rather than just animate.

## Editing without regenerating

Once you edit a deck in the browser it's marked `edited: true` and `npm run decks` will skip
it, so your wording survives. `npm run decks -- --force` regenerates and discards those edits.

## Troubleshooting

`Internal Server Error` or `__webpack_modules__ is not a function` means a stale build cache,
usually from touching `.next` while the dev server was running:

```bash
npm run reset && npm run dev
```

## Layout

| path | |
|---|---|
| `traces/` | the decks, as code |
| `decks/` | compiled JSON the browser reads |
| `src/schema` | op vocabulary, view types, validation |
| `src/engine` | folds ops into state; animation maths |
| `src/views` | one renderer per data structure |
| `src/deck` | navigation, transitions, the slide renderer |
| `src/tracer` | the `t.*` API |
| `app/` | the browser studio |
