# House style — LeetCode slide decks

How a deck is written. `src/tracer/tracer.ts` is the API; this is the judgement.
Read this before authoring `traces/<slug>.ts`. `traces/two-sum.ts` is the reference.

You do not write React. You write a working implementation of the optimal solution,
instrumented with the `t.*` tracer. Running it produces the slides, so the animation can
never disagree with the algorithm. Write real logic — never hard-code the steps you expect.

---

## Structure

One optimal solution, its intuition, and a dry run. Nothing else.

1. **hook** — `t.section("hook")` with no `show`. One slide, one punchy line.
2. **problem** — two or three slides. The input on screen and what is being asked. That is all.
   **Never show the answer here.** Do not highlight the winning pair, draw the connecting arc,
   or state the result. The walkthrough is the payoff; spoiling it removes any reason to watch.
   Pose the question — "two of these add up to 9", "return their two indices" — and stop.
3. **walkthrough** — most of the deck. A dry run on a small input, one decision per slide.
   The intuition lives *here*, as one `t.callout(...)` at the moment it becomes obvious —
   not in a lecture beforehand.
4. **code** — the snippet, shown once, at the end, as the payoff. One slide per line.
5. **intuition** — the closing card. A heading and one or two sentences.

No brute-force section. No separate insight section — explaining the trick before the viewer
has watched it run is the easiest way to lose them.

## Pacing

There is no clock. A slide lasts until the presenter clicks, so the only budget is slide count.
25–40 is comfortable.

- **ONE CHANGE PER SLIDE.** If the cursor moves *and* a value updates *and* a region grows on
  one click, causality is lost. Split it.
- Make the search visible. Never just assert `no 2 behind us` — light up the cells being
  checked on their own slide, then answer on the next.
- **Do not editorialise about what the algorithm cannot do.** A value that hasn't been
  reached yet isn't "unusable" — it simply hasn't been stored. Saying "we can't use it" is
  wrong the moment the walk arrives there, which it usually does. State what happens; the
  mechanism explains itself.
- Clear per-cell chips (`a.tagClear()`) when the cursor moves, or the previous number's tag
  stays pinned to the old cell.
- Linger where the idea forms (more slides), skim mechanical repeats (fewer, and stop
  narrating once the pattern is clear).

## The one rule that matters most

**Find the invariant and draw it.** Every algorithm worth a deck has one quantity that only
moves one way — that IS the intuition, and it needs a persistent object on screen for the whole
walkthrough:

| problem | invariant | op |
|---|---|---|
| 121 Best Time to Buy | the cheapest-so-far line, which only drops | `bar.level()` |
| 11 Container | the width, which only shrinks | `bar.area()` |
| 1 Two Sum | the region behind you, which only grows | `a.window()` |
| 3 Longest Substring | a left edge that never moves back | `a.window()` |

Decide what yours is **before** writing any slides.

## Slide labels

The label is what the step **does**, in the algorithm's own language — not narration.

```
WRONG (narration)          RIGHT (step)
"We'd need 7."             need = 9 − 2 = 7
"So we store it."          seen[2] = 0
"That's too slow."         n(n−1)/2 pairs  →  O(n²)
```

Narrate the comparison, never just the outcome: say the arithmetic with the real values, then
the decision it forces. Use `→` for "becomes", `·` to separate facts, `✓` for a match. Under
~42 characters. Leave it empty on a slide that only holds a picture.

## Narration — `t.say()`

The presenter note. Never shown to the viewer; it is what the author plans to say.

**Give the moving parts personalities.** Pointers are characters with motives, not indices:

> "The red pointer loves zeros, so it always points to the first zero."
> "Green keeps moving ahead, searching for non-zeros and throwing them at red."

Not: *"Set i to the index of the first zero and advance j."*

Contractions, second person, short sentences. `t.say()` **appends** — two calls on one slide
concatenate, so build one line and say it once.

## The code pane

Once, at the end, 6–10 lines. **Use the exact words the deck used** — if you said "cheapest"
and "best", the code says `cheapest` and `best`, never `mn`/`res`/`ans`. Name what you drew:
if a shaded rectangle was called water, the variable is `water`. Strip `def`, type hints, and
`return` when the answer is already on screen. Python, because it reads closest to pseudocode.
`t.line(...)` the 2–3 lines you are talking about.

## Humour

`t.aside("...")` renders a small wry margin note, visually separate from the teaching. One or
two per deck, under 55 characters, never mid-explanation. Punch at the problem, never the
viewer. `meta.tagline` is the social caption's joke — e.g. 283 Move Zeroes → *"before anyone
catches them"*.

## If the author supplied a script

Their words **and their line breaks** are fixed. Every `t.say()` must be a verbatim line from
`narration/<slug>.txt`, in order — no additions, merges, rewording, not even for grammar. You
choose only the visuals. The build fails with a diff if you changed anything.

---

# Tracer API

## Sections and slides
```
t.section(kind, { show, title })
  kind: 'hook' | 'problem' | 'walkthrough' | 'code' | 'intuition' | 'custom'
  show: ['nums', ['seen', 'v'], 'code']   // one row per entry; nest ids to sit side by side.
                                          // Row heights come from what each view needs —
                                          // do NOT hand-tune them.
  override only if asked for specific spacing:
    layout: [{ view:'id', row:0, col:0, span:12, rowSpan:1 }]   rows: 3   rowSizes: [1, .7, 1.3]

t.slide(label?)        // commit everything queued as ONE slide — one click
t.hold(label?)         // a slide that changes nothing — a pause to talk over
t.say('...')           // presenter note for the slide being built
t.line(4, 5)           // highlight these 1-based source lines on this slide
```

## Overlays (queued onto the next slide)
```
t.callout(text, 'insight' | 'warn' | 'math' | 'note')
t.aside('Fine for 5 numbers. Less fine for 10,000.')
t.formula('9 − 2 = 7')
t.result([0, 1], 'Answer')      // big reveal, scrims the board behind it
```

## Views — each returns a live handle you compute with
```
const a   = t.array('nums', [2,7,11,15], { label:'nums' })
const s   = t.string('s', 'abcabcbb', { label:'s' })
const bar = t.bars('p', [7,1,5,3,6,4], { label:'price' })   // heights — best for magnitudes
const m   = t.map('seen', { label:'seen' })                 // t.set(id) for a set
const st  = t.stack('st')        const q = t.queue('q')
const g   = t.grid('g', [[1,1,0],[0,1,0]])
const v   = t.vars('v')
const tr  = t.tree('t', [{id:'n1',value:3,left:'n2',right:'n3'}], 'n1')
const gr  = t.graph('g', [{id:'a'},{id:'b'}], [{from:'a',to:'b',directed:true}])
const ll  = t.list('l', [1,2,3])
t.code('code', SOURCE, 'python')
t.text('id', 'Heading', ['line one','line two'], 'bullets' | 'big' | 'plain')
```

## Array / string handle
```
a.length  a.at(i)
a.read(i, 'active')                 // returns the value AND highlights the cell
a.highlight([i,j], style)  a.clear()
a.swap(i,j)  a.set(i,v)  a.push(v)  a.pop()
a.window(from, to, 'remembered')    a.windowClear()   // tinted band — a region you've covered
a.link(i, j, '2 + 7 = 9')           a.linkClear()     // arc joining two cells
a.tag(i, 'needs 7', 'want'|'have'|'miss')   a.tagClear()   // chip pinned above one cell
a.pointer('i', 0, 'primary')  a.move('i', 1)  a.drop('i')

  pointer colors: primary | secondary | accent | success | danger
  styles: idle | compare | active | match | bad | window | done | visited | dim
```

## Bars handle — every array op above, plus
```
bar.level(1, 'cheapest so far')     bar.levelClear()   // horizontal reference line
bar.gap(4, '+5')                    bar.gapClear()     // measured gap from the line to a bar
bar.area(1, 8, 7, '7 × 7 = 49')     bar.areaClear()    // shaded region between two bars
```

## Map — behaves like a real Map
```
m.put(k, v)   m.add(k)   m.has(k) -> boolean   m.get(k)   m.peek(k) (silent)
m.delete(k)   m.highlight(k, style)   m.clear()   m.size
```

## Stack / queue / grid / vars
```
st.push(v) st.pop() st.peek() st.top() st.isEmpty st.length      q.enqueue(v) q.dequeue()
g.rows g.cols g.at(r,c) g.set(r,c,v) g.paint([[r,c]], style) g.cursor(r,c) g.dropCursor()
v.set('left', 0)   v.setAll({ left:0, right:7 })   v.highlight('best')
```

## Tree / graph / list
```
tr.left(id) tr.right(id) tr.value(id) tr.visit(id) tr.mark(id, style) tr.set(id, v) tr.swapChildren(id)
gr.mark(id, style)  gr.edge(from, to, style)
ll.head() ll.next(id) ll.value(id) ll.mark(id, style) ll.relink(from, to) ll.remove(id) ll.setHead(id)
```
