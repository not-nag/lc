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

## History

An earlier Remotion **video** generator lived here and was removed once slides replaced it.
It is intact at commit `644985b` — renderer, timing engine, and 10 traces. To bring it back
beside this project without touching it:

```bash
git worktree add ../LC-video 644985b
```
