---
uid: doc-bdbc46b0
id: DOC-53
type: doc
title: The reproduction engine and the loop-1 session — the diagnosing session's knowledge
  base
created_by: REQ-261
created_at: '2026-09-16T20:55:42.661492+00:00'
updated_at: '2026-09-17T00:01:10.683048+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  doc_kind: architecture
  epic_parent: epic-bf282b3d
---

**Audience: the loop-1 diagnosing session, not the builder AI.** This document
carries `doc_kind: architecture`, so `exportCorpus` excludes it from the
production system KB — `inSystemKb()` admits only `doc_kind: system_kb`
(`tools/generate/src/cli/kb.ts:256`). Nothing here reaches a client-facing
conversation. It is the session's knowledge base and only the session's.

Its three jobs:

1. **Explain the pipeline** — what the reproduction engine is made of, what each
   part owns, and which part is responsible for which kind of residual.
2. **Explain the session's role** — what a loop-1 round is for, what it may and
   may not do, and what a good round produces.
3. **Accumulate learnings** — how to find and fix issues well with the tools a
   round actually has. This section grows. It is the reason this is a living
   document rather than a one-off write-up.

Written against [[REQ-262]]. §1 and §2 describe the engine and the session as
they stand today; §3 accumulates and is never finished.

---

## 1. The pipeline

A reproduction runs **capture → fold → render → gate**, and every residual
belongs to exactly one of those stages. Naming the stage is most of the
diagnosis, because it decides which module owns the fix and what evidence is
admissible.

```
live site ──capture──▸ reference bundle ──fold──▸ L1 document ──render──▸ site
                              │                                            │
                              └──────────────── gate ◂───────────────────── ┘
```

`tools/generate/src/` is the whole engine. Roughly 44,000 lines, but the parts
a round diagnoses are these.

### 1.1 Capture — `cli/capture/`

Navigate the live site in a real browser, intercept and mirror every response,
read **computed** styles out of the rendered DOM, screenshot, segment, and
assemble a bundle. `pipeline.ts` is the sequence; `extract.ts` is the script
that runs *in page scope*, so every colour and font is read after `var()` has
resolved and every hidden node is filtered by real geometry — the things static
HTML cannot see. There is no static fallback: a browser failure retries and
then fails ([[DOC-13]] §2.1, §3).

**A bundle holds more than the brief names.** In
`storage/references/<site>/<page>/`:

| file | what it is authoritative for |
|---|---|
| `raw.html` | **ground truth.** The bytes the origin served. |
| `capture.json` | the catalog-agnostic structured essence — sections, theme, assets, backgrounds. The AI's primary input ([[DOC-13]] §4). |
| `multistate.json` | the 6-viewport × 4-interaction-state oracle. The `ValueManifest` the value gates compare against. |
| `l1.json` | the folded L1 document, if the bundle was folded. |
| `forms.json`, `hints.json` | folded form structure; structural hints from `hints.ts`. |
| `screenshot.full.png` | the full-page raster the perceptual diff shoots against. |
| `screenshot-{320,375,768,1024,1280,1440}.png` | the per-viewport rasters. |
| `rendered.html` | the DOM after scripting, distinct from `raw.html`. |
| `assets/` | every mirrored subresource, so the bundle is re-extractable offline. |

**What capture deliberately does not record.** Not CSS mechanism — no
`flex-direction`, no tag names. Every field is a *rendered fact*: a painted
box, a computed radius, the browser's own a11y role and name. Two different
DOMs that render identically project to the same values, and that is the point.
A residual of the form "the engine lost the fact that this was a `<ul>`" is
usually not a capture gap; it is a request for a mechanism capture is designed
not to carry.

### 1.2 Fold — `l1/fold.ts`

Turns the multi-viewport capture into one `L1Document`. It matches each node
across the sampled widths, then emits one L1 leaf per node carrying its
authored axes, a geometry keyframe track, per-segment `interpolate|snap` flags,
and a visibility rule derived from presence across the ladder.

**The fold emits the absolute-base form.** Every leaf is absolutely placed by
its per-width keyframes. That is always a valid layout and it closes the
round-trip with zero structural inference. The structure primitives — container
layout, sizing — are left empty deliberately; they are an optional overlay
recovered later, on demand, by `promoteToFlow`.

This is why `fold.ts`'s own header can say reproduction is *near-mechanical*,
and why it is worth quoting to yourself before filing: **"Any residual delta is
a serializer bug or a missing L1 axis — a framework fix, not a per-site one."**
That sentence is this loop's whole thesis, written by the engine about itself.

### 1.3 L1 — the substrate

The typed element tree. [[DOC-23]] is the substrate, [[DOC-27]] the
reproduction vocabulary, [[DOC-30]] the control-surface API; read those rather
than re-deriving them here.

What a round needs from them is the shape of one residual class: **"L1 has no
axis for this."** The test is [[DOC-24]]'s — *an axis belongs in L1 iff it
moves a pixel*. A property that moves a pixel and has no typed axis is a
framework gap and a good ticket. A property that moves no pixel is not.

### 1.4 Probes — `l1/probes.ts`

Three probes decide whether a reproduced document is geometrically good enough:

- **(a) sample-fidelity** — reproduced geometry matches the oracle at the 6
  captured widths, within tolerance.
- **(b) off-sample** — renders sane at 500px and 900px, widths the fold never
  sampled: no overlap, no clip.
- **(c) content-robustness** — perturbed content (longer text, taller image)
  keeps the envelope.

**The evaluator is analytic and browser-free.** It mirrors what the renderer
emits — the absolute `interpolate|snap` geometry maths and CSS flow stacking —
and estimates a text run's natural height. So every probe is deterministic
evidence on every run, never a cross-engine skip. The browser-backed
`capture(render(L1)) ≈ L1` check is separate, in `roundtrip.ts`.

**What probes cannot see.** They are geometry and envelope only. Colour, type,
gradients, imagery — a probe is silent on all of it. A page can pass all three
probes and be visibly wrong, which is exactly the case the value gates exist
for.

### 1.5 Gate — `cli/gate-core.ts`

**The gate is the instrument, not the engine.** It judges the reproduction, and
it can be wrong independently of whether the reproduction is. A defect here is
as real as a defect in the fold, and harder to see, because the instrument is
what you would normally use to look.

Three gates, reconciled into one verdict:

1. **the L1 gate** — `threeProbeGate`, §1.4.
2. **the perceptual eye** — `perceptual-core.ts`, pure arithmetic over rasters.
   Floors: mean > `PERCEPTUAL_MEAN_FLOOR` or pct > `PERCEPTUAL_PCT_FLOOR` is a
   breach.
3. **the value gates** — `capture/values-diff.ts`. `flattenCapture` /
   `flattenSignals` project both sides into a flat `ValueManifest`, one
   `ValueElement` per verbatim text run plus a `SectionValues` per section for
   treatments a text run cannot hold. `diffManifests` aligns by case-folded
   text and diffs each field. **These are the sharpest evidence a ticket can
   carry**, because they are exact values with selectors, not impressions.

Plus **reference coverage** — two proxies the pipeline already computed and
never used to report: unreferenced mirrored images, and segmentation density.

**The verdict ladder, in `reconcileGates`, in order.** The order is the whole
mechanism, so read it as a ladder and not as a set:

| # | condition | verdict |
|---|---|---|
| 1 | `!l1Gate.pass` | `structural-failure` |
| 2 | no perceptual breach | `pass` |
| 3 | `coverage.findings.length` | `capture-incomplete` |
| 4 | `deltas > 0` | `reproduction-wrong` |
| 5 | otherwise | `unexplained-disagreement` |

Rung 3 sitting above rung 4 is deliberate and documented: a delta count
measured against an impoverished reference is not evidence, because the value
gates compare elements present in both manifests and are therefore *blind* to
substance the capture never recorded. They are not disagreeing; they cannot
see.

**The consequence a round must hold in mind.** A false coverage finding does
not merely add a noisy line — it *hijacks* the verdict, converting a
`reproduction-wrong` run into `capture-incomplete`, which this loop's own brief
treats as "stop, file nothing." §3.1 is the worked example of exactly that, and
it is the reason §1.5 opens the way it does.

### 1.6 Field-level distinctions that cost tool calls to rediscover

This list grows. Each entry is here because a round spent calls deriving it
from source.

**Background imagery is `backgroundImageUrl`, never `src`.** `src` is for
replaced content in flow. A background image paints a SURFACE behind content,
so it never reaches the element manifest as `src` — `values-diff.ts:246-250`,
`extract.ts:1336-1340`, `types.ts:443-446` ("Distinct from `src`"). On a page
whose imagery is all CSS `background-image`, the string `"src"` may not occur
in `multistate.json` at all.

## 2. The session's role

A **loop-1 round** ([[EPIC-12]] §7.1) reads the evidence one reproduction left
on disk and describes what the ENGINE cannot yet do. It improves the engine by
diagnosing it. It writes no code.

**Its tools are `Read`, `Glob`, `Grep` and `Bash`.** `Bash` is there for one
reason: to run `xgd`, which is the API this project exposes to an agent for
reaching the ticket store. Everything else that can spawn an agent or reach the
network is still denied by name — [[REQ-256]] behaviour 3, as narrowed by
[[REQ-262]] D7. Consequences a round should plan around:

- **`Bash` could not be given narrowly, and this was measured.** A scoped allow
  rule of the form `Bash(xgd ticket get:*)` admits `Bash` wholesale and does not
  enforce the prefix. So the round holds a real shell: "it writes no code" is an
  instruction it is expected to keep, not a wall it cannot cross. Keep it.
- **Never create a ticket at a `ready_*` status.** That is a dispatcher trigger
  — it spawns an autonomous pipeline against the ticket within about thirty
  seconds. Gap tickets are handed to the console, which files them at
  `status: draft`, and that remains the route.
- A 4,000-line `multistate.json` is far cheaper to grep than to read. Grep
  first, read only the region you need.

**What a round produces.**

- **One gap ticket against the reproduction engine.** Detailed, and with no
  bound on its size or on the scope of work it asks for. A round that finds
  five related residuals writes one ticket describing five, not one ticket
  describing the most provable one. Deferring findings to "a later round"
  discards them — the later round starts from zero and will not know they were
  seen.
- **Bugs, separately, for anything else it trips over** — in L1, in this
  document or the standing brief, or anywhere in the broader `1c`
  implementation. These are not folded into the gap ticket. They are their own
  tickets, filed by the console, at `status: draft`.

**What a round must never do.** Diagnose the site rather than the engine. A
residual is a serializer bug, a missing L1 axis, a missing capture hint, or a
region that needs promoting to flow. It is never "the hero on this site should
move down 20px". The site config is disposable; the durable output is the
framework growth the residual forces.

**The one rule**, from [[DOC-19]] and restated in the standing brief because it
is the most-violated one: *transcribe from the captured DOM, do not reconstruct
from memory and a screenshot.* It binds a diagnosis exactly as hard as it would
bind a fix. If a claim cannot be stated as a value read out of a file, it is
not made.

## 3. Learnings — how to find issues well

This section accumulates. Each entry names what was found, how, and what made
it findable, so the next round can reuse the method rather than the conclusion.

### 3.1 Check the instrument against the evidence, not only the evidence against itself

*From the first live round, `gigabytealchemy.ai`, 2026-09-16.*

`gate.json` reported one coverage finding: the mirrored hero image was
referenced by no element, so "the capture kept the bytes but never attributed
them to the page."

The round did not take that at face value. It opened the files the finding was
derived from and found the attribution present in all three of them —
`capture.json` carried the section background, `multistate.json` carried the
matching `backgroundImageUrl`, and the reproduction's own L1 carried it too.
The finding was false, and the cause was one line in `referenceCoverage()`
building its referenced set from `manifest.elements[].src` alone.

It then traced the consequence rather than stopping at the wrong line:
`reconcileGates` tests coverage BEFORE value deltas, so on any perceptually
breached run that false finding overrides `reproduction-wrong` and returns
`capture-incomplete` — which the brief tells a round means *stop, file
nothing*. A cosmetic-looking false positive silently disables loop 1 on any
site whose imagery is painted as a background.

**The method, generalised.** A gate finding is a claim the engine makes about
itself. Verify it against the captured files before diagnosing from it. When a
finding turns out to be false, do not stop at the false finding — follow it
into the verdict ladder and ask what it causes, because a wrong instrument is
worth more than a wrong pixel.

### 3.2 Grep for the field, not for the symptom

The round established that `"src"` occurs **zero** times in the entire
`multistate.json` for that page. That single grep converted "the coverage check
looks wrong" into "the coverage check reads a field this manifest structurally
cannot contain" — a claim an implementer can act on without re-deriving it.

Counting occurrences of a field name across the manifest is cheap and often
decides between "the value is wrong" and "the code is reading the wrong place".

### 3.3 Search the ticket store before filing

The same false positive had been observed once before and recorded in prose
inside a completed ticket, where it shipped without a code change. The round
found it with a grep of the ticket store and said so in the ticket, which is
the difference between "here is a defect" and "here is a defect we have now
seen twice and never fixed."

**Do this with `xgd`, not with grep.** The round has `Bash` for exactly this
([[REQ-262]] D7), so prior art is `xgd ticket list` and `xgd ticket get` — not
a grep of `.xgd/tickets/`. The first round found its prior observation by
grepping the store, which worked and should not be repeated: the on-disk layout
is xgd's own business, and a round that reads it by path is coupled to an
internal it does not own and will break silently when it moves.

Writing stays the console's. A round hands back its gap ticket and the console
files it at `status: draft`.

## 4. Related

[[REQ-262]] (the work this document is part of) · [[REQ-261]] · [[REQ-256]] (the round) ·
[[REQ-254]] (the console) · [[REQ-255]] (the rail) · [[EPIC-12]] §7.1, §8 ·
[[DOC-19]] (the reproduction runbook) · [[DOC-21]] (the growth loop) ·
[[DOC-23]] (L1 substrate) · [[DOC-27]] (L1 reproduction vocabulary) ·
[[DOC-30]] (L1 control surface) · [[DOC-39]] (the knowledge management system,
and why this document is not in the production KB)