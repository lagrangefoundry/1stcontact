---
uid: bug-349db72c
id: BUG-143
type: bug
title: 'l1-gate: no probe can see a backing surface separating from the content it
  backs, and viewport height is not an axis at all'
created_by: EPIC-12
created_at: '2026-09-25T02:40:45.049473+00:00'
updated_at: '2026-09-25T02:40:45.049473+00:00'
completed_at: null
last_field_updated: created_at
status: draft
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