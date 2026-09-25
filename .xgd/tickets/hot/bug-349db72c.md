---
uid: bug-349db72c
id: BUG-143
type: bug
title: 'l1-gate: no probe can see a backing surface separating from the content it
  backs, and viewport height is not an axis at all'
created_by: EPIC-12
created_at: '2026-09-25T02:40:45.049473+00:00'
updated_at: '2026-09-25T20:12:31.610289+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9f797f96
  commits:
  - working_sha: 26f5491165d1b54a9b4a0d0206d85b1f38eb5e69
    reconcile_sha: null
    main_sha: null
  - working_sha: 5fdccec7da152f03af06d1d9a067f7e2473eacde
    reconcile_sha: null
    main_sha: null
  version: 0.2.357
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


### 8.7 The repro console prints the count the gate grades

`measureServed` (`cli/repro.ts`) built its per-width envelope line from a bare
`evaluateLayout`, which resolves no backing and therefore asserts no containment.
Left alone it would have printed a clean envelope for a page whose panels had slid
off their copy — the same "verdict the reader cannot see" this ticket is about, one
surface further out. It now goes through `onSampleProbe`, so the number on the
console and the number the gate grades are the same number. Both that line and the
`1c gate` summary print `width×height`, because a count whose height is invisible
cannot be told apart from a count at a height that was never sampled.


### 8.8 What the alarm actually reports on the reported reproduction

Measured against the retained `gigabytealchemy.ai` capture in this checkout, folded
through the landed code. The fold declares `backedBy` on 44 runs. Escape counts,
per `width×height` sample:

| probe | result |
|---|---|
| on-sample (6 widths × 2 heights) | **0** — clean at every captured sample, as §3 said |
| off-sample (10 widths × 2 heights) | **2**, both at 637px |
| content +15% (6 widths × 2 heights) | **8** — 2 at 320, 3 at 375, 1 each at 1024/1280/1440 |
| `acceptanceGate` verdict | `pass: false` — `onSample: true`, `offSample: false`, `contentRobustness: false` |

So §5's central claim holds on the real bundle: the gate verdict flips from
`pass` to failed, and the `layout` block carries named escapes instead of
`findings: []`. §5's content-growth prediction of eight escaping runs at +15% is
matched exactly.

**Two of §5's numbers came out differently, and the difference is a decision, not
a shortfall:**

- **Off-sample reports 2 escapes at 637px, not 14 at 500px.** §3's exploratory
  harness took ownership by containment at 1280px alone. The landed derivation
  requires a surface to cover a run at **every** captured width before it counts as
  backing it (§8.2), which excludes pairings that never held across the ladder —
  precisely so a reflow is not reported as a surface coming apart. That is the
  stricter, quieter rule, and it costs most of the fourteen. 500px is also no
  longer sampled: the segment rule (§8.4) samples 506px, which is clean, and 637px,
  which is not.
- **This bundle does not fail at a height it was not captured at.** Its escape
  counts are identical at 768px and 1536px. The height axis is exercised — every
  sample above is a `width×height` pair, and §4.3's machinery is what makes the
  pair reachable — but the evidence that a wrong height response is *caught* rests
  on the synthetic `heightBlindPage` UAT, not on this capture. §5's third bullet is
  therefore satisfied as "a vertical resize is reachable and gated", not as "this
  bundle fails vertically".

Both are recorded here rather than tuned away: loosening the unanimity rule to
recover the larger count would make every responsive reflow an escape, which is
the failure mode that would retire the alarm within a day.