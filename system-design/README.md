# System Design Slides

Self-paced system design decks that run in a browser. Arrow keys to advance, `F` for
fullscreen. Built to be screen-recorded while you narrate. Every deck starts with the
simplest design that works, breaks it with a number, and fixes exactly that — one box at a time.

## Run it

Needs **Node 20+**.

```bash
npm install
npm run decks     # compile traces/*.ts → decks/*.json
npm run dev       # http://localhost:3200
```

Port 3200, so it runs alongside the LeetCode decks (`../slides`, port 3100).

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

Write `traces/<slug>.ts`. It describes the design being built up, slide by slide:

```ts
const s = t.system("arch");
t.section("walkthrough", { show: ["arch"] });

s.node("client", "Client", { tier: 0, kind: "client" });
s.node("api", "API server", { tier: 2 });
s.edge("client", "api", "1k QPS");
t.say("One server handles everything.");      // presenter note
t.slide("one server");                         // the line on screen

s.bottleneck("api", "CPU at 95%");
t.say("At ten thousand requests a second the single server saturates.");
t.slide("10k QPS  →  one server saturates");
```

Then `npm run decks`. It validates as it compiles — boxes, arrows and request paths that don't
exist, and the house rules: a component added without a bottleneck to answer, a bottleneck and
its fix on the same slide, two boxes on one slide, or the diagram shown before the walkthrough
all fail the build.

**Read `HOUSE-STYLE.md` first.**

## Editing without regenerating

Once you edit a deck in the browser it's marked `edited: true` and `npm run decks` skips it.
`npm run decks -- --force` regenerates and discards those edits.

## Troubleshooting

`Internal Server Error` or `__webpack_modules__ is not a function` means a stale build cache.
`npm run reset`, then `npm run dev`. Never delete `.next` while the server is running.
