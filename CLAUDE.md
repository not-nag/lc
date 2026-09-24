# LeetCode explainers — two projects in one repo

**READ THIS FIRST. Pick the right project before doing anything.**

## → `slides/` — the active project. Use this.

Turns a LeetCode problem into a **self-paced slide deck in the browser**. 16:9, arrow keys to
advance, editable in place. This is what the author uses today.

```bash
cd slides
npm install          # first time only
npm run decks        # traces/*.ts → decks/*.json
npm run dev          # localhost:3100
```

**Its own `slides/CLAUDE.md` is the real instruction file — go read it.**
`slides/HOUSE-STYLE.md` is how a deck should be written.

## `src/`, `traces/`, `storyboards/`, `renders/` at the repo root — archived.

The earlier Remotion **video** generator. It still works (`npm run traces`, `npm run render -- <slug>`)
but the author moved to slides because video fixes the pacing at render time. Its instructions
are in `HOUSE-STYLE.md` and `PLAN.md` at the root.

**Do not add to it or take it as the pattern to follow** unless the user explicitly asks for a
rendered MP4. If they say "make a video", ask whether they mean a deck they record themselves
(slides — the usual answer) or an automated MP4 (the root project).

## Deciding quickly

| the user says | go to |
|---|---|
| "make slides / a deck for LeetCode N" | `slides/` |
| "make a video for LeetCode N" | ask — almost always `slides/`, recorded by them |
| "render an MP4 without me recording" | repo root |
| anything about editing text, pacing live, presenting | `slides/` |

## Not a PowerPoint generator

These are HTML decks rendered in a browser, not `.pptx` files. If the user wants a real
PowerPoint file, that is a different job — say so rather than exporting something lossy.
