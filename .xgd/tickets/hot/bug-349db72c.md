---
uid: bug-349db72c
id: BUG-143
type: bug
title: 'l1-gate: no probe can see a backing surface separating from the content it
  backs, and viewport height is not an axis at all'
created_by: EPIC-12
created_at: '2026-09-25T02:40:45.049473+00:00'
updated_at: '2026-09-25T17:13:53.789251+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9f797f96
---

# The envelope probes cannot see a backing surface separating from its content

## 1. What the operator sees

Iteration 6 of `gigabytealchemy.ai` is, at rest, the best reproduction the loop
has produced: `meanDiff 0.22`, zero perceptual regions, four `LOW` value deltas,
`sampleFidelity` max delta 0.008px. Resize the browser — either axis — and the
background bands, section shading and card panels slide away from the text they
are painted behind. The operator called it structural. Nothing in the gate
reports it.

This is the **alarm** half of the pair, in the same relation to its defect that
[[BUG-112]] had to [[BUG-113]] (§12): the detector is the test for the fix, so it
lands first. The defect itself is [[BUG-142]].

## 2. Why nothing sees it — three independent blindfolds

**2.1 The collision scan excludes this node class by name.** `evaluateLayout`
(`tools/generate/src/l1/probes.ts:855`) builds its pairwise set as

```ts
const solid = ctx.leaves.filter(l =>
  l.kind !== 'slot' &&
  !(l.kind === 'box' && isSynthesizedSurfaceId(l.id)) &&   // section-band-*, section-bg-*, card-*
  l.box.height > 0 && l.box.width > 0)
```

Every fold-synthesized backing surface is filtered out *before* the only
geometric check runs. The exemption is correct for what it was written for — a
fill painted behind its own runs overlaps them by design — but it is the whole
population this defect lives in.

**2.2 There is no containment check anywhere.** `envelopeAt` (`probes.ts:1140`)
is the single function all three probes call, and the envelope it asserts is
sibling-overlap plus horizontal-clip. A backing surface is not a participant in
any geometric assertion the engine makes. "Overlaps something it should not" is
tested; "no longer covers what it exists to cover" is not expressible.

**2.3 Viewport height is not a variable.** `evaluateLayout(doc, width, {contentScale,
epsilonPx})` has no height parameter. Each keyframe carries an `atHeight`, but
there is exactly one height sample per width (`320x800 375x800 768x1024 1024x768
1280x800 1440x900`), so height is a recorded constant and never an axis. The
vertical half of the operator's report is not undetected — it is unmodelled.

**2.4 And the sampling is too sparse to stumble on it.** `offSample` samples two
widths, 500 and 900 (`probes.ts:1163`).

## 3. The measurement — the probe runs the failing case and reports clean

Ownership taken at rest at 1280px (the runs whose box sits inside each surface),
then re-checked under perturbation. Harness: `.xgd/tmp/bandprobe2.mjs`.

| perturbation | runs escaping their backing surface | worst overhang | what `l1-gate` says |
|---|---|---|---|
| width 500px | **14 of 69** | **576px** | `offSample` **pass** |
| width 900px | 3 of 69 | 25px | `offSample` **pass** |
| content +15% | 8 of 69 | 99px | `contentRobustness` fails, but on unrelated text-on-text pairs |
| content +30% | 12 of 69 | 182px | as above |

`offSample` evaluates the geometry at 500px — the width where fourteen runs have
walked up to 576px off their panels — and returns zero findings. Iteration 6's
`gate.json` reports `"layout": { "pass": true, "findings": [] }`.

Under content growth the two layers are fully decoupled: **0 of 14 panels move
while 46 of 53 text runs move, by up to 161px.**

## 4. What should change

**4.1 A surface owns the content it backs, and the fold says so.** Today the
relationship exists nowhere: at rest a panel and its runs line up only because
their coordinates coincide. A probe has to guess ownership by containment-at-rest
(which is what §3's harness does) and a guess is not a gate. The fold records
which runs each synthesized surface backs. Where [[BUG-142]] lands first this is
already true by construction and this ticket reads the parent link instead.

**4.2 A containment probe.** For each backing surface, assert that every run it
backs stays inside it — not merely "does not collide with", but "is still
covered by". A run that has left its panel is a finding that names the run, the
surface, and the overhang in pixels.

**4.3 Viewport height becomes an evaluator axis.** `evaluateLayout` takes a
height alongside its width, the probes sample more than one height per width, and
a node's `viewportResponse` is resolved against it. Without this the axis on
which the defect is most severe cannot be reached at all.

**4.4 `offSample` samples more than two widths.** Two points between six rungs
cannot characterise the interpolation between them.

## 5. Testable

- Iteration 6's bundle, unchanged, goes from `offSample: pass` to failed —
  naming the fourteen runs that have left their backing surface at 500px, each
  with its surface id and its overhang in pixels.
- The same bundle fails a containment probe under content growth, naming the
  eight runs that escape at +15%.
- A vertical resize is reachable: the probes evaluate at least two viewport
  heights per width, and iteration 6 fails at a height other than its captured
  one.
- `gate.json`'s `layout` block carries those findings rather than
  `pass: true, findings: []`.
- A reproduction whose panels do hold their content still passes all four probes
  — the alarm does not fire on a clean page.

## 6. Order

This before [[BUG-142]]. The alarm is the test for the defect, and the same
argument §10 makes for filing the rail before the loop it measures applies here:
a fix landed against a gate that cannot see the thing it fixes is a fix nobody
can show working.

## 7. Related

- [[BUG-142]] — the defect this detects.
- [[BUG-112]] / [[BUG-113]] — the same alarm-then-defect pair, one loop earlier.
- [[EPIC-12]] §2.6 (the bar), §12 (loop 1 in practice).


---

## 8. What landed

### 8.1 `backedBy` — the ownership record (§4.1)

`l1TextSchema` gains an optional `backedBy: string`, the id of the synthesized
surface painted behind the run. The fold writes it: `SurfaceRow` carries the text
node it was collected from, and `buildSolidBands` / `buildCards` stamp their own
id back onto every row they were built out of. A band claims its rows only *after*
the `base === null` early return, so a band that paints nothing — and is therefore
never emitted — leaves no run naming a surface that does not exist.

The axis is inert at render time. It names a relation, not a paint property.

**The name must answer to something.** `validateL1` gains a structural rule,
`backingSurfaceExists`: a `backedBy` naming an id the document does not declare is
refused, and the error names the unanswered id. This is a consequence of §4.1
rather than a separate ask — the relation is only worth recording if it is
checkable, and a dangling name is not a harmless typo but an assertion that
silently never runs, which is the exact failure mode this ticket exists to close.

### 8.2 Containment (§4.2) — and the two rules that keep it honest

`evaluateLayout` takes an optional `backing` map and emits a third finding kind,
`escape`, naming the run, the surface id, and the overhang in pixels and on which
side. A surface hidden at the sampled width is skipped: a run outliving its own
surface is that surface's visibility rule working, not a defect.

Two decisions were needed that §4.1 did not settle, because the ownership record
cannot be the *only* source of pairings:

- **A document that declares nothing is still gated.** Every document folded
  before `backedBy` existed — including the `gigabytealchemy.ai` bundle this was
  reported on — declares no backing at all. Excluding them would leave the pages
  the defect was reported on ungated, so `deriveSurfaceBacking` also *derives*
  ownership by containment-at-rest, and reports the same escape.
- **The derivation is unanimous, so a reflow is not an escape.** A pairing is
  derived only when the surface covers the run at **every** captured resting
  state. A run that sits on a band at desktop and somewhere else entirely at
  mobile was never backed by it, so the reflow that moves it is not a surface
  coming apart. Without this the alarm would be noise on every responsive page.

The backing is resolved **once**, from the resting document, and handed to every
sample. Deriving it per sample would let a perturbed sample re-decide which panel
owns which run — and "does a pairing that held at rest still hold" is not a
question that can be asked if the pairing moves with the answer.

### 8.3 Viewport height as an axis (§4.3)

`evaluateLayout` takes `viewportHeight` beside its width, and resolves each node's
`viewportResponse` against it — computing the same number the renderer's
`calc(y + yFactor * (100vh - atHeight))` emits. At the captured height the two
terms cancel, which is what makes the axis safe to add to every existing caller.

The probes sample **two heights per width**: the shortest height the capture
measured, and 1.5× the tallest. The upper end is deliberately a height nothing was
captured at — a wrong height response is exact everywhere it was measured, so a
bracket that only visits measured heights cannot reach the defect.
`capturedHeights` (the measured set) is kept distinct from `envelopeHeights` (the
bracket) because one caller needs the measured set specifically — see §8.5.

### 8.4 Off-sample width sampling (§4.4)

`offSampleWidths` replaces the constant pair `[500, 900]` with **two interior
points per ladder segment**, at a third and two thirds across each. Against the
six-rung ladder that is ten samples rather than two, with every segment covered
twice; the old constants left two segments unvisited entirely, and the reported
reproduction came apart at 506px inside a segment that was sampled at 900 and
passed. Nothing is sampled below the first rung or above the last: the renderer
holds the end keyframe there, so the only thing such a sample could report is that
boxes measured at 320px overflow a viewport narrower than 320px — true of every
page, and evidence about none.

### 8.5 The escapes reach the operator, and change nothing else

`gate.json`'s `layout` block now carries the escapes from the off-sample and
content-robustness reports as well as the on-sample one, each collision tagged
with the height it was found at. Naming only the on-sample report would have left
the operator reading `findings: []` under a failed verdict — the shape of the gap
this ticket is about — because a containment escape is by construction invisible
at rest at every captured width.

**The recovery choice is deliberately not re-priced.** REQ-278's `chooseRecovery`
counts collisions and clips only; `escape` findings are excluded, and it is graded
at the captured heights rather than the bracket. This is a consequence of this
being the alarm half of an alarm/defect pair (§6): both candidate documents
inherit the same synthesized surfaces from the same fold — the recovery moves
runs, it does not build panels — so an escape count measures the fold's decoupling
([[BUG-142]]), not the recovery's merit. Pricing it here would make the alarm
decide what ships: the flow recovery would lose on a count it did not cause, and
every page would silently regress to a base document nobody chose for as long as
BUG-142 stays open. An alarm reports; it does not choose the served document.

### 8.6 Evidence

`tests/test_UAT_FC_BUG-143_surface_containment_height_axis.test.ts` — twelve UATs
covering §4.1–§4.4, all five bullets of §5, and the four decisions above: the
refused dangling name, the undeclared-document path, the reflow that is not an
escape, and the segment sampling rule.