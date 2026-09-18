---
uid: request-1e65a5f0
id: REQ-274
type: request
title: 'values-diff: one projection over both sides — retire the asymmetric-axis defect
  as a category'
created_by: EPIC-12
created_at: '2026-09-18T22:31:18.860464+00:00'
updated_at: '2026-09-18T23:40:46.580611+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 8
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5dd0ad13
  commits:
  - working_sha: 7d4743575f6d5360c3bf3cc83f3606e56c4559bd
    reconcile_sha: null
    main_sha: null
  - working_sha: 94dda174e834d3459c872feebe2b198c92795599
    reconcile_sha: null
    main_sha: null
  version: 0.2.271
---

# One projection over both sides — retire the asymmetric-axis defect as a category

## Where this came from

EPIC-19 audited the ten tickets rounds 1–3 filed and grouped their 22 defects.
Four of the 22 share one root: **the reference side and the reproduction side are
read by two different procedures**, so an axis can be recorded, projected or
normalised on one side and not the other, and the comparator has no way to know.

REQ-270 #3 said it outright. The four were fixed one axis at a time
(REQ-269 #5, REQ-270 #2/#3/#4). None of those fixes stops the fifth.

## The two procedures

`tools/generate/src/cli/capture/values-diff.ts`:

- `flattenCapture(capture: Capture): ValueManifest`   — line 1121, the reference
- `flattenSignals(signals: RawSignals, source): ValueManifest` — line 1178, the reproduction

Same return type, two independent bodies, ~185 lines between them. Every axis the
gate compares has to be read twice, in two places, by two authors, and the type
system cannot tell you when only one of them was updated — `ValueManifest` is
satisfied either way.

`flattenSignals`' own doc comment records the resulting drift as a known fact:

> Section values are read from the *raw* bands (uncoalesced), so the two sides'
> section indices do NOT correspond — the capture's are coalesced by style
> signature.

## Why this is not just "call one function twice"

The two sides genuinely have different inputs and this ticket must not pretend
otherwise:

- `Capture` is a stored bundle, written by the extractor, possibly at an older
  `CAPTURE_SCHEMA` (see the sibling capture-completeness ticket).
- `RawSignals` is a live extraction from a rendered reproduction, in this
  process, always current.
- The capture's sections are coalesced by style signature; the reproduction's
  bands are raw. BUG-102 already had to join them by geometry rather than index
  because of this, and that join is correct and stays.

So the deliverable is **not** one function over both inputs. It is **one place
where each axis is read**, with the two inputs normalised to a common
intermediate first.

## Behaviour wanted

1. **An axis is declared once.** A single table — axis name, where it lives on a
   `Capture`, where it lives on `RawSignals`, its type, its tolerance — and both
   manifests are projected from that table rather than from two hand-written
   bodies. Adding an axis means adding a row, and it is then present on both
   sides or on neither.
2. **A half-projected axis is a build error, not a silent clean gate.** If the
   table names an axis that only one side can supply, that is stated at the
   declaration and the comparator treats it as unmeasured (the discipline
   BUG-106/BUG-111 established), rather than comparing against a default.
3. **The existing four fixes are expressed in the table, not beside it.** REQ-269
   #5, REQ-270 #2/#3/#4 are re-landed as rows; if any of them cannot be expressed
   that way, say so in the ticket rather than leaving a special case unremarked —
   a table with four exceptions has not retired the category.
4. **The coalesced-vs-raw asymmetry stays, and is named.** This ticket does not
   change the section join. It changes who reads an axis, not how bands are
   paired.

## Acceptance

- Every axis compared by `diffValues` is reachable from one declaration site,
  and a test enumerates the table and asserts both projections cover it.
- Adding a row with a reference-side reader and no reproduction-side reader makes
  the axis report `unmeasured`, and a test shows the gate saying so rather than
  passing.
- No regression in the gate verdict for the three stored references.

## Not in scope

The capture's own completeness (does the extractor record the axis at all) is the
sibling ticket. This one is about what happens to an axis that IS recorded.
---

## What landed

### The table

`tools/generate/src/cli/capture/value-axes.ts` is the single declaration site.
One row = one manifest field = one axis, and a row states, as **required**
properties: the axis name, its scope (`manifest` / `section` / `element`), its
role, a note in the vocabulary of both sides, and **both** sides — each as
either a reader function or `unsupplied('<why>')`. A half-declared row is a
compile error; a side that genuinely cannot read the axis is a *statement*, not
an omission. The tables are `MANIFEST_AXES`, `SECTION_AXES`, `GEOMETRY_AXES`,
`RUN_AXES`, `FIELD_AXES` (an element axis belongs to exactly one of the three
element tables, so there is never a second row to forget), re-exported from
`capture/index.ts`.

`flattenCapture` and `flattenSignals` in `values-diff.ts` are now projections
*over* that table rather than two hand-written bodies: ~440 lines of duplicated
reading deleted. Nothing reaches a manifest except through a row — a test
asserts that too, so an axis cannot be smuggled back into one projection body.

### `compared` vs `carried` — a role on the row

The row's `role` is load-bearing, not documentation. A **carried** axis exists
for the L1 fold (a link target, an inline-flow id, a media `src`) and moves no
pixel, so a side that cannot supply it is a gap in the fold's input, not in the
gate's evidence. A **compared** axis that only one side can supply is precisely
the defect this ticket retires. Only `compared` rows reach `UNMEASURED_AXES`.

### The fifth instance — found, named, and now visible

Behaviour 3 asked for the four earlier fixes to be re-landed as rows. They are
(REQ-269 #5 as carried `linkHref` / `headingDepth` rows; REQ-270 #2 as the
`backgroundImageUrl` row with two readers and a mirrored-basename compare;
REQ-270 #3 as the `overlay` row whose `scrimOf` reads a translucent background
*colour* first, then a translucent colour *stop*, on both sides; REQ-270 #4 as
`contentAnchorRatio`, whose same-population caveat is a pairing question the
comparator settles per band, not a projection one). No exceptions were needed.

Writing them as rows exposed the fifth the ticket predicted: **`paddingTopPx`,
`paddingRightPx`, `paddingBottomPx` and `textAlign` on a text run.** REQ-64
added all four to `RawRun` and to the comparator, but nothing added them to
`ContentRun`, so the reference has never been able to supply them, the
comparator's both-sides guard never fired, and four *compared* axes have read
clean on every text run of every reproduction since. They are declared as
reference-side `unsupplied(...)` with the reason stated, which is what makes
them enumerable and what carries them to the gate.

Recording the axis in the bundle is the sibling capture-completeness ticket's
job; this ticket's job was to stop the silence, which it does.

### Unmeasured reaches the gate, and is named rather than counted

`UNMEASURED_AXES` is a property of the *instrument* — true of every comparison.
`observedUnmeasuredAxes(expected, actual)` is the per-run fact: an axis is
unmeasured **here** only when the side that CAN read it actually carried a
value, so there was something to compare and nothing to compare it with. A run
that never touched the axis reports nothing, because a permanent row on every
report is a row nobody reads by the time it matters.

`ValuesDiffReport.unmeasuredAxes` carries the rows to `reconcileGates`, which
adds an `outstanding` line to the pass rung, and to `formatGateReport`, which
prints a `⚠` row under the values block so an operator reading the terminal sees
it without opening the JSON (the trip BUG-111 exists to remove). The axes are
listed, not counted: "1 axis unmeasured" is not actionable; "the reference
records no text-run padding" is.

**Decision on "rather than passing".** The acceptance above says an unmeasured
axis should make the gate "say so rather than passing", and also that there must
be no regression in the gate verdict for the three stored references. Those pull
opposite ways, because the live table's own unmeasured axes are present on every
existing reference. Resolved in favour of the verdict: an unmeasured axis is a
**report fact, never a verdict** — the same discipline BUG-106 and BUG-111
established for unpaired bands. The run still passes; the pass no longer claims
there is nothing outstanding. `nextStep` stops reading "Nothing outstanding from
this gate."

### Colour and gradient helpers extracted

`normalizeGradient` and the colour normalisation it depends on moved out of
`values-diff.ts` into `capture/color-values.ts` so the table can read them
without importing the module that imports the table. Behaviour is unchanged; it
is an import-cycle break, not a rewrite.

### What did NOT change

The section join. The capture's bands are coalesced by style signature and the
reproduction's are raw, so their indices do not correspond, and BUG-102's
geometry join pairs them exactly as before. A row says *who reads an axis*,
never *how two bands are paired* — and a UAT pins that asymmetry so a later
reader does not mistake the table for a claim about pairing.

## Test plan

`tests/test_UAT_FC_REQ-274_one_projection_over_both_sides.test.ts` — seven UATs:

1. every row names its axis, states its role and note, and states **both** sides
   as a reader or an `unsupplied(reason)`; no axis is declared twice.
2. both projections cover every two-sided row — present on both manifests or on
   neither — and nothing reaches a manifest that the table does not declare.
3. a synthetic table with a reference-only **compared** row reports `unmeasured`
   (and a `carried` one does not); the live table's answer is REQ-64's four.
4. the real projections carry the fact into `diffManifests`, with no delta
   manufactured out of the gap.
5. the gate passes, names the axes in `nextStep`, and `formatGateReport` prints
   them.
6. an axis the run never reached is not reported.
7. the coalesced-vs-raw asymmetry stays: two spellings of one axis, one row, no
   delta; REQ-271's schema gate lives in the row; the geometry join untouched.

Regression: the full `vitest run` sweep on the branch — 572 files / 4950 tests
pass. The six failures are pre-existing and unrelated (`bug32-webui-scope-rebrand`
and `test_UAT_FC_BUG-67_backend_settings` fail identically on `xgd-working`;
`test_UAT_FC_BUG-112_on_sample_layout_gate` fails identically at this branch's
HEAD before these changes; the knowledge-base and build-smoke suites are
worktree/parallel-load artifacts and pass in isolation). `tsc --noEmit` over
`tools/generate` is clean.