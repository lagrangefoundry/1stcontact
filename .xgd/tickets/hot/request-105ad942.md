---
uid: request-105ad942
id: REQ-51
type: request
title: Object-grouped inspection + comparison output (per-object params, incl. position)
created_by: xgd
created_at: '2026-07-10T17:19:59.829477+00:00'
updated_at: '2026-07-13T18:05:07.706895+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 34f3cb52c994d4644555ee8fc15a9e3381cb017f
    reconcile_sha: null
    main_sha: null
  version: 0.0.93
  bundled_in: bundle-d9c2e655
---

## Goal

Make the AI **see** the obvious fidelity differences without the operator having
to point them out. Reorganise inspection output and the comparison from a flat,
property-centric, globally-severity-sorted stream into an **object-centric view**:
grouped by object — text box, image, button, divider — INCLUDING position, so a
reproduction can be read and diffed object by object.

Surfaced by [[REQ-36]] ("brutal, one tiny change at a time; the AI can't see the
obvious differences"). Design discussion on CHAT-7.

## Problem (today)

`values-diff` already computes a superset of the right per-box parameters
(family, size, weight, colour, box geometry, radius, shadow, gradient, …) and
aligns reference↔repro box-to-box. But `formatReport` emits ONE flat list sorted
by global severity across all boxes — all colours, then all sizes, interleaved by
tier. The operator thinks in objects ("the hero heading is wrong on 4 axes"); the
tool scatters that box's 4 deltas across a 142-row list. Nothing renders "here is
object X: reference vs repro, every parameter side by side, including where it
sits." Unpaired boxes vanish into an `unmatched` count instead of a loud gap.

## Requirement

1. **Object-grouped view.** For each reference object (text run, image, control,
   divider), pair it with its repro object and render a card: a fixed parameter
   table — `fontFamily · fontSizePx · fontWeight · color · letterSpacingPx ·
   lineHeightPx · box {x,y,w,h}` — reference vs repro, one column each, mismatches
   flagged inline. Images/controls carry their own relevant params (src/objectFit/
   aspect/box; a11yRole/accessibleName/box).

2. **Position is first-class.** Every object shows its `box {x, y, width, height}`
   in the card. Position is the residual that iteration converges — it must be
   visible per object, not buried.

3. **Loud unpaired reporting.** "N reference objects had no repro match; M repro
   objects matched nothing" up top, not folded into a count (cf.
   [[capture-hides-lazy-and-animated]]).

4. **Same vocabulary as the spec.** The card's "expected" column prints in the
   exact styled-run shape the spec consumes (sibling ticket: unify spec
   vocabulary), so a delta row is a paste-able edit: read the object, write the
   value, re-diff.

5. **Make it the primary read in the loop**, ahead of the perceptual pixel-mean
   `1c diff` — the mean reads "≈98% done" while structural defects sit unflagged
   (the existing `formatReport` comment already says this).

## Scope of change

- `tools/generate/src/cli/capture/values-diff.ts` — an object-grouped projection
  over the existing `diffManifests` data (grouping is presentation; the per-box
  comparison already exists). `Field`/`ContentRun` geometry already carries `box`.
- `tools/generate/src/cli/fidelity.ts` — `formatReport` gains/loses to the
  object-card renderer; unpaired section surfaced.
- Tests: object-grouped output; position present per object; unpaired loud.

## Intended workflow this unlocks

Object-by-object reproduction: (1) read the inspection's per-object description →
create precisely corresponding spec objects; (2) render; (3) iterate only on
objects that don't match. Intrinsic axes (text content, colour, fontFamily,
fontSizePx, fontWeight) should match on the FIRST iteration — they are captured
verbatim and, with the unified vocabulary, copied verbatim. Emergent geometry
(box position/size — a function of layout, container, and wrapping) is the
residual that iteration converges. See sibling: unify spec vocabulary.


## Implemented (free-coded)

Object-grouped projection landed over the existing `diffManifests` pairing — no
change to the comparison logic or tolerances; purely additive + a rewritten
renderer.

- `tools/generate/src/cli/capture/values-diff.ts` — new `ObjectKind` /
  `ObjectParam` / `ObjectCard` / `UnpairedObject` types; `ValuesDiffReport` gains
  `objects: ObjectCard[]` (one card per reference object, full param table incl.
  `box`, mismatches flagged, worst-severity for ordering) and `unpairedActual:
  UnpairedObject[]` (repro objects that matched nothing). Cards are built inside
  the two existing pairing loops from each object's own delta slice (filtered
  through the same ignore-mask, which is now hoisted above the loops). Fixed
  per-kind tables: text = typography + box; image = name/objectFit/aspect/box;
  control = name/nameSource/box; divider = box. Non-fixed deltas (gradient,
  borderLeft, shape, arrangement, text casing, …) append so nothing is lost.
- `tools/generate/src/cli/fidelity.ts` — `formatReport` rewritten from the flat
  severity list into: loud `⚠ UNPAIRED` header (both directions) → per-object
  cards worst-first (badged by tier, `box` first-class, inline ✓/✗, `expected`
  column = paste-able value) → clean-object count → `section / render-only
  checks` tail for non-object deltas. `--json` emits the enriched report.
- `tools/generate/src/cli/capture/index.ts` — export the four new types.
- Tests: `tests/req51-object-grouped-report.test.ts` (8 × `test_UAT_FC_REQ-51_*`)
  — grouping, box-per-card, paste-able expected column, clean object, loud
  unpaired both directions, object-grouped `formatReport`, image/control cards.
- Concrete output format documented in [[DOC-19]] (CHAT-7 section, "The format
  you read").

Sibling REQ-50 (spec vocabulary) not depended on: the `expected` column already
prints the spec's own field names/units, so a delta row is paste-able today.