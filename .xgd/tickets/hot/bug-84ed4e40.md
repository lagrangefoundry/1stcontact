---
uid: bug-84ed4e40
id: BUG-112
type: bug
title: 'gate: a reproduction that paints text over text passes — on-sample layout
  collisions are computed and discarded'
created_by: EPIC-12
created_at: '2026-09-18T02:25:29.092070+00:00'
updated_at: '2026-09-18T05:15:39.882671+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-af2a66dc
  commits:
  - working_sha: 6162558c2db128aae48c8042764439eef32f4074
    reconcile_sha: null
    main_sha: null
  - working_sha: a87c8f8fc65a7888212755dae11ce7569d40d7ca
    reconcile_sha: null
    main_sha: null
  version: 0.2.261
  story_points: 5
---

# The gate cannot see text painted over text

## What is wrong

Iteration 3 of the `gigabytealchemy.ai` reproduction returned:

```
verdict: "pass"   l1Pass: true   meanDiff: 0.31 (floor 8)   pctOverThreshold: 0.1% (floor 25%)
diagnosis: "The perceptual eye and the structural gate agree the reproduction is faithful."
```

The document that console iteration actually served
(`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3/page.json` →
`data.page.l1`), evaluated with the engine's own `evaluateLayout`, reports **five
text-on-text collisions at 1280px** — the exact width the gate photographs — and
four to five at every other captured width:

```
375   overlap=4
768   overlap=5
1280  overlap=5     <- the width the gate photographs
1440  overlap=5
  "Intentional Software" overlaps "Tools for clarity, presence, and positive connection"
  "Designed for developers building AI-enhanced workflows" overlaps "Open source and community-driven"
  "Completely on-device—your thoughts never leave your phone" overlaps "Creates space for deeper reflection and insight"
```

The operator sees this in the browser as form controls painted over the prose
above them. The gate calls it faithful, so the AI round spends its budget on
fourteen sub-pixel value deltas instead.

## Why the gate cannot see it

The detector already exists and already fires. `evaluateLayout` in
`tools/generate/src/l1/probes.ts` emits `kind: 'overlap'` for any two solid leaf
boxes that intersect. Two independent reasons the finding never reaches a
verdict:

1. **`sampleFidelityProbe` throws the findings away.** It calls
   `evaluateLayout(doc, width)` at every captured width — on the served document
   — and destructures only `leaves`. The overlap findings are computed and
   discarded on the same line.

2. **The two probes that do report findings grade a document nobody serves.**
   `gate-core.ts` builds `recovered = promoteToFlow(base)` and runs the
   off-sample and content-robustness probes against `recovered`. On this bundle
   `recovered` has **zero findings at every width**. The document `1c repro`
   writes is the absolute base, not `recovered` — see the sibling ticket.

So the only probe that looks at the served document discards its findings, and
the only probes that report findings look at a different document.

## Behaviour wanted

A reproduction that paints text over text is wrong regardless of how the pixels
average out, so this is a **structural gate failure, not a ranked region**.

1. The gate evaluates the **document the reproduction actually serves** at every
   captured width and surfaces the resulting `LayoutFinding`s.
2. Any `overlap` finding at a captured width fails the gate. The verdict names
   the colliding leaves and the widths, in the same shape a coverage finding is
   already named, so the AI round's brief carries it without a new format.
3. `clip` findings at a captured width are surfaced the same way. The existing
   off-sample and content-robustness probes are unchanged — this adds the
   on-sample, unperturbed case they never covered.
4. The synthesized-backing-surface exemption already in `evaluateLayout`
   (`section-band-*` / `section-bg-*` / `card-*`) still applies: a fill painted
   behind its own runs is by design and is not a collision.
5. Where an overlap is genuinely intended — a deliberate stacked composition —
   it must be **explicitly chosen and recorded on the node**, never a silent
   default. The engine must not emit an unmarked overlap.

## Testable

- Run the gate against `storage/references/gigabytealchemy.ai/index` as it
  stands today: it currently returns `pass`; after this it must **fail and name
  the five colliding pairs at 1280**.
- A reproduction with no collisions still passes — the gate does not become
  unconditionally red.
- Both directions must be demonstrated, per the epic's rail principle (§8.4).

---

## What landed

### 1. Probe (d) — the on-sample envelope

`onSampleProbe(doc, { widths })` in `tools/generate/src/l1/probes.ts` evaluates a
document at the **captured** widths (`doc.widths` by default) with content
exactly as the document holds it, and returns the existing `EnvelopeReport`
shape. The three envelope probes now share one `envelopeAt(doc, widths, scale)`
helper — they differ only in which document, which widths and how much content
perturbation, so that is all each of them says. `offSampleProbe` (500/900, scale
1) and `contentRobustnessProbe` (captured widths, scale 2.5) are behaviourally
unchanged.

### 2. The gate grades the SERVED document

`threeProbeGate` is renamed **`acceptanceGate`** (`ThreeProbeReport` →
`AcceptanceReport`, `ThreeProbeOptions` → `AcceptanceOptions`) because it now
runs four probes over **three documents**, and a name that says "three" while
running four is the class of quiet drift this codebase refuses elsewhere. The
three documents:

- `doc` — the absolute base; sample-fidelity is a property of it;
- `options.recovered` — the structure-recovered overlay; off-sample and
  content-robustness measure it, unchanged;
- `options.served` — **new** — what is actually written to disk and loaded by a
  browser; the on-sample probe measures it.

`served` is a parameter rather than an assumption because "which document does
the operator's browser load" is a fact about the caller, and the one time this
module guessed, the gate certified an artifact nobody served. `cmdL1Gate` passes
`served: base`, named, with the reason recorded beside it — `cmdRepro` imports
`promoteToFlow` and never calls it, and whether that is the right document is
BUG-113's question, not this one's.

### 3. The verdict names what collided

- `LayoutCollision` in `gate-core.ts` carries `{ kind, detail, width, paths }`.
  `kind` + `detail` are deliberately the same two keys a `CoverageFinding`
  carries, so every surface that already prints one prints the other with no new
  format: `detail` is a finished sentence (`at 1280px: "A" overlaps "B"`).
- `layoutCollisions(EnvelopeReport)` flattens a report into that list, width by
  width and in page order within each width.
- `ReconcileInput.l1Gate` widens from `Pick<L1GateResult,'pass'>` to
  `Pick<L1GateResult,'pass'|'onSample'>` — **required**, not optional, for the
  reason BUG-106 already argues in that file at length. Every caller holds a
  whole `L1GateResult`, so it costs nothing.
- `GateReport.layout: { pass, findings }` is the new key. On a
  `structural-failure` carrying collisions the `diagnosis` names the colliding
  leaves and the widths, and the `nextStep` names **both** ways out: give the
  region structure so it cannot overlap, or declare the stack on the node.
- `formatGateReport` prints the collisions under the `l1-gate` row, and is
  silent when there are none — a row reading "0 collisions" on every page for
  ever is a row nobody reads by the time it matters.
- `check_fidelity` returns `layout` beside `coverage`, so an AI round's brief
  carries the collisions without a new format.

### 4. `stacked: true` — the declared stacking intent

A new node-level axis on `nodeAxisGroupsShape` in
`packages/site-schema/src/l1/schema.ts`, therefore carried by every kind that
renders a box (`text` / `image` / `box` / `container` / `slot` / `control`).

- `true` is its **only** legal value. `false` is rejected, because it would be a
  second spelling of absent — and absent has to keep meaning "nobody has chosen",
  so that an unmarked overlap stays a finding rather than a silent default.
- `evaluateLayout` exempts any pair in which **either** side is `stacked`,
  alongside the existing synthesized-backing-surface exemption
  (`section-band-*` / `section-bg-*` / `card-*`), which is untouched. One side is
  enough: an overlap has a figure and a ground, and the declaration is made by
  whichever node is the composition.
- It is **not a paint axis** — it moves no pixel and the renderer emits nothing
  for it, exactly like `heading` / `link` / `action`. A capture cannot recover it
  (the browser shows the stack, not the reason for it), so a folded document
  never carries one and the gate's finding is the fold gap to close. Auto-marking
  from the oracle was considered and rejected: on `faelan.com` the hero title
  overlaps the hero `image`, and because the renderer paints in document order
  with no z-index, the image is painted **over** the title. Silencing that on the
  grounds that the reference stacked there would certify a page whose headline is
  invisible — the exact failure this ticket exists to end.

## Supersedes

`test_UAT_FC_REQ-88_l1_gate_surfaces_and_recovers_pinned_residual` asserted that
demand-driven recovery closing the content-robustness residual makes the run
pass. That is invalidated on one point and one only: recovery is a property of
the overlay, and a verdict is a claim about the page the operator loads. The
UAT still pins that the residual is surfaced and that recovery closes it; it now
also pins that the gate does **not** pass, because that fixture's served base
overruns its own body copy at 320 and 375px, unperturbed. It always did; there
was simply no probe that looked.

## Note on the "five colliding pairs" acceptance

Measured before implementing: the five overlaps are real findings of
`evaluateLayout` on the served base at 1280, and the oracle's own element boxes
for those pairs do **not** overlap — the evaluator estimates a text run's height
from an average glyph advance rather than reading the oracle's measurement of it,
and over-counts by a line. BUG-113 owns that estimator (its body now says so
explicitly and reports the base going to zero overlaps once the measurement is
used).

So the real-bundle UAT here pins the property this ticket's title names —
**nothing computed is discarded**: every finding `onSampleProbe` reports on the
served document appears in the verdict the operator reads, at the width it was
found at, and a non-empty list is always a `structural-failure`. Pinning the
literal count `5` would have made this UAT a trap for its own sibling. Both
directions of the rail are demonstrated on synthetic fixtures that do not depend
on the estimator being wrong.

## Test plan

`tests/test_UAT_FC_BUG-112_on_sample_layout_gate.test.ts` — 8 UATs:

- an on-sample overlap at a captured width fails the gate, while the off-sample
  and content-robustness probes (grading the recovered overlay) both pass — the
  blind spot, reproduced in miniature;
- a reproduction with no collisions still passes, assembled exactly as
  `cmdL1Gate` assembles it;
- the verdict names the colliding leaves and widths, the findings carry the same
  `{kind, detail}` shape a coverage finding does, and the operator read prints
  them;
- a clean run carries an empty list and says nothing about collisions;
- a `clip` at a captured width is surfaced the same way;
- synthesized backing surfaces are still exempt;
- a declared `stacked: true` stack is exempt, an unmarked one is not, and
  `stacked: false` is refused by the validator;
- the real `gigabytealchemy.ai` bundle (skipped when absent — `/storage/references/`
  is gitignored): every finding survives the trip from probe to verdict.

Regression scope: `reconciliation-3probe-gate`, `reconciliation-3probe-gate-evaluator`,
`req86-e2e-repro`, `req88-l1-repro-pipeline`, `bug9-region-aware-promote`,
`bug6-signal-not-drop`, `bug7-row-layout`, `reconciliation-cross-gate-reconciliation`,
`reconciliation-l1-shared-axis-groups`, `req105-node-axis-groups`,
`test_UAT_FC_REQ-156_fidelity_in_workerd` (workers project),
`test_UAT_FC_REQ-157_fidelity_surface`, `test_UAT_FC_BUG-100_coverage_background_images`
— all green, plus the full `node` project sweep.