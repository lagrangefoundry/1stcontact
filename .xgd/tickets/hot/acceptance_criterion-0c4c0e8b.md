---
uid: acceptance_criterion-0c4c0e8b
id: AC-1286
type: acceptance_criterion
title: --collapse reports one row per defect across the viewport ladder, and states
  the raw total it compressed
created_by: xgd
created_at: '2026-08-20T03:40:55.091996+00:00'
updated_at: '2026-08-20T07:00:16.894077+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-aaddb221
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

`--collapse` reports one row per **defect**, not one per cell. Across a
multi-viewport run, deltas sharing an element and a property become a single row
that records the set of widths it fires at; the reference and our values fold to
one scalar when constant across those widths and to a range (`a .. b`) when they
vary. Synthetic cross-element `systemic` rollups are excluded from the per-defect
rows. The header states the unique-defect count *and* the raw delta total it was
derived from, so the compression is visible rather than silent.

The point is that the count becomes monotonic in fidelity: one wrong value is one
defect however many rungs of the ladder it appears at, so a genuine repair moves
the number by one rather than being lost in a six-fold multiplier.

The collapsed view is **scriptable, not screen-only**: under `--json` the same
collapsed defect rows are emitted as a machine-readable document — one entry per
defect, each carrying its element, property, folded expected/actual values and
the width set it fires at — rather than the text report. The two views carry the
same defects; only the serialisation differs.

## Verification

Build a multi-viewport cell set in which one element/property is wrong at every
width with a constant reference value, a second is wrong at every width with a
reference value that varies across the ladder, and a third is a `systemic`
rollup. Collapse it and assert: three cells of the first become one row carrying
all three widths and a single scalar expected value; the second becomes one row
whose expected value is rendered as a range; the systemic rollup produces no row;
and the header reports both the collapsed defect count and the larger raw total.
Re-run the same set with `--collapse --json` and assert the emitted document
parses and carries exactly the same defect entries — same count, same
element/property pairs, same width sets, same folded values — as the text view's
rows.