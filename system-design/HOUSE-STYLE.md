# House style — system design decks

How a deck is written. `src/tracer/tracer.ts` is the API; this is the judgement.
Read this before authoring `traces/<slug>.ts`. `traces/url-shortener.ts` is the reference.

You do not write React. You write a trace: a declarative description of a design being built
up, one box at a time, in response to numbers. There's no algorithm to execute — but the
handles keep a mirror of the diagram and throw on anything impossible, and the linter enforces
the rules below. Compute every figure from stated assumptions; never type a result.

---

## Structure

1. **hook** — `t.section("hook")` with no `show`. One slide, one line.
2. **problem** — two or three slides. What the system does (a `spec` of the API is ideal) and
   the two or three requirements that will drive every later decision. No boxes.
3. **estimate** — the numbers. QPS, storage, read/write ratio, key space. One number per slide,
   each with its derivation as the note (`"100M ÷ 86,400 s"`). This is what makes the rest
   non-arbitrary. A table schema beside the numbers justifies the row size.
4. **walkthrough** — the bulk. Start naive, break it, fix it, repeat. See *Rounds*.
5. **tradeoffs** — where you'd choose differently, and why. A `compare` per decision, one row
   per slide, then a `pick` that says under what conditions.
6. **intuition** — a text card: the one sentence someone should remember.

## The one rule that matters most

**Every architecture change answers a specific bottleneck. Show the bottleneck before the fix.**

The bottleneck marker is the persistent object on screen. There is only ever one; it sits on
the box that breaks next, says by how much, and *moves* when you set it somewhere else.

| rule | enforced by |
|---|---|
| never show the finished diagram up front | architecture views are declared empty; lint rejects one in hook/problem/estimate |
| every component must be earned | lint: after the first bottleneck, a box or replica bump needs an unanswered `s.bottleneck` |
| show the bottleneck *before* the fix | lint: bottleneck and fix on the same slide is an error |
| numbers before boxes | lint warns on a bottleneck with no digit; figures come from `si`/`rate`/`bytes` |
| one change per slide | lint: two boxes on one slide is an error; three additions of any kind warns |

The first build (client → server → database) is free: nothing has broken yet.

## Rounds

Each round of the walkthrough has the same shape, one slide per beat:

```
s.label("client", "app", rate(reads))            // 1. the load arrives — a number on an arrow
load.set("one app server", `~${rate(LIMIT)}`)    // 2. the limit — a number in the readout
s.bottleneck("app", "116k vs 20k/s")             // 3. what breaks, by how much
s.replicas("app", 6)                             // 4. exactly one change
s.resolve("19.3k/s each")                        // 5. the number that says it worked
```

Beats 1–2 can be skipped when the numbers are already on screen. Beat 5 is worth keeping: the
✓ is the payoff and it clears the marker, so the next round starts clean.

A box may arrive with the one arrow that connects it — that's one component, one change.
`s.insert(id, label, [from, to])` drops a box into an existing arrow (a load balancer between
client and servers) as a single change rather than a remove and two adds.

Linger where the idea forms, skim mechanical repeats. Once per deck, trace one request end to
end through the naive design and again through the finished one (`s.request(...)`) — the
contrast *is* the lesson.

## Slide labels

The label is what the step **does**, with its numbers — not narration.

```
WRONG (narration)                 RIGHT (step)
"The server gets overloaded."     116k ÷ 20k ≈ 6× over
"So we add a cache."              check a cache first
"Now it's fine."                  11.6k < 20k ✓
```

`→` for "becomes", `·` to separate facts, `✓` when a fix lands. Under ~42 characters. Leave it
empty on a slide that only holds a picture.

## Narration — `t.say()`

The presenter note. Never shown. Contractions, second person, short sentences. Give the boxes
motives — the load balancer "owns the one address", the key service "hands out blocks".
`t.say()` **appends** — build one line and say it once.

## Humour

`t.aside("...")` — one or two per deck, under 55 characters, never mid-explanation. Punch at
the problem, never the viewer: *"Ships Friday. Fine until Monday."*

## If the author supplied a script

Their words and line breaks are fixed. You choose only the visuals.

---

# Tracer API

## Sections and slides
```
t.section(kind, { show, title })
  kind: 'hook' | 'problem' | 'estimate' | 'walkthrough' | 'tradeoffs' | 'intuition' | 'custom'
  show: ['arch', 'load']        // one row per entry; nest ids to sit side by side: [['schema','est']]
                                // row heights and column widths come from what each view needs
t.slide(label?)   t.hold(label?)   t.say('...')   t.line(2, 3)   // line: highlight spec lines
```

## Overlays (queued onto the next slide)
```
t.callout(text, 'insight' | 'warn' | 'math' | 'note')
t.aside('Ships Friday. Fine until Monday.')
t.formula('62⁷ = 3.5T')
t.result('302', 'Answer')
```

## Numbers — compute, don't type
```
import { si, rate, bytes, commas, DAY } from "@/tracer/tracer"
si(115740) → "116k"   rate(1157) → "1.2k/s"   bytes(9.1e13) → "91.3 TB"   commas(86400) → "86,400"
```

## Views
```
const s    = t.system('arch', { label?, tiers? })   // architecture — declared empty
const load = t.numbers('load')                      // capacity readout; t.number(...) writes to the latest
const c    = t.compare('codes', [{ id, title, sub }], { label })   // 2 or 3 options
t.spec('api', SOURCE, 'http' | 'sql' | 'text')      // API signature or schema; t.line() highlights
t.text('id', 'Heading', ['line one', 'line two'], 'bullets' | 'big' | 'plain')
```

## Architecture handle
```
s.node(id, label, { tier, row?, x?, y?, kind?, sub? })
    tier: 0 client · 1 edge · 2 service · 3 data        (column; only tiers in use are drawn)
    row:  slot within the column, top to bottom         x/y: 0..1 of the pane, overrides both
    kind: client | edge | service | cache | store | queue | worker   (store draws a cylinder)
s.edge(from, to, label?, { async? })     s.unedge(from, to)
s.insert(id, label, [from, to], { tier, kind, labelIn?, labelOut? })   // split an arrow with a box
s.label(from, to, '116k/s')              // annotate / re-annotate an arrow; null clears
s.highlight(id | [from, to], style)      s.clear()
s.bottleneck(id, '116k vs 20k/s')        // THE marker; setting it again moves it
s.resolve('19.3k/s each')                // clears it, with a ✓ on this slide
s.replicas(id, 6, noun?)                 // draw as a stack: ×6, or ×10 shards
s.relabel(id, label?, sub?)              s.remove(id)

const r = s.request('GET /x7Kp2Qa', ['client', 'lb', 'app', 'cache', 'app', 'lb', 'client'])
r.step(n = 1, label?)   r.to('cache', label?)   r.done()
    // token appears at path[0]; each step/to is one slide; multi-hop moves animate through
    // every hop and light each arrow as it's crossed. Consecutive path nodes need an arrow.
```

## Numbers / compare handles
```
load.set(key, value, note?)   load.highlight(key, style)   load.drop(key)
t.number(key, value, note?)                            // same as .set on the latest panel
c.row('Collisions', { hash: ['possible — retry', 'bad'], counter: ['never', 'good'], ranges: 'n/a' })
c.pick('ranges', 'our pick')    c.pick(null)            // tones: good | bad | meh (bare string)
```

styles: idle | compare | active | match | bad | window | done | visited | dim
