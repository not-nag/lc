# LC

Projects live in their own folders here. The repo root holds nothing but them.

## → `slides/` — LeetCode slide decks

Turns a LeetCode problem into a self-paced slide deck in the browser.
**`slides/CLAUDE.md` is the instruction file — read that.**

```bash
cd slides
npm install      # first time only
npm run decks    # traces/*.ts → decks/*.json
npm run dev      # localhost:3100
```

## → `system-design/` — system design slide decks

Same engine, different subject: turns a system design topic into a deck that starts naive and
adds one box per bottleneck. Copied from `slides/`; engine, deck, studio and theme are shared
in shape, views and tracer are its own.
**`system-design/CLAUDE.md` is the instruction file — read that.**

```bash
cd system-design
npm install      # first time only
npm run decks    # traces/*.ts → decks/*.json
npm run dev      # localhost:3200 — runs alongside slides on 3100
```

`.claude/launch.json` here holds both dev servers for the preview tool (`slides`,
`system-design`); it's tool config, not a project.

## History

An earlier Remotion **video** generator lived here and was removed once slides replaced it.
It is intact at commit `644985b` — renderer, timing engine, and 10 traces. To bring it back
beside this project without touching it:

```bash
git worktree add ../LC-video 644985b
```
