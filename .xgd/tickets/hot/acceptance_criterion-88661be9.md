---
uid: acceptance_criterion-88661be9
id: AC-1288
type: acceptance_criterion
title: Every defect carries a Type-A flat / Type-A structural / Type-B repair class,
  and the report prints in that order
created_by: xgd
created_at: '2026-08-20T03:40:58.273135+00:00'
updated_at: '2026-08-20T07:00:13.954489+00:00'
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

Every counted defect carries a repair class, and the report is printed in repair
order. A delta on an author-set value is **Type A** — the reference states it
literally and the repair is to copy it. A delta on emergent geometry is **Type
B** — a measure of how far off the render is, not a value to set directly. Within
Type A, a defect is **structural** rather than **flat** when the reference value
varies across the viewport ladder, or when it fires at only some widths (a fluid
reference against our fixed value); otherwise it is flat.

Section spacing is **not** a third structural trigger. REQ-73
(`request-859652ae`, free_and_reconciled 2026-07-18) dropped the section band
vertical-padding (`paddingTopPx` / `paddingBottomPx` on `§N`) deltas, because the
reference distributes the same visual gap across different contributors
(margins vs our padding) and the `gap` axis measures the sum that actually
matters. No `§<n>` row can therefore carry a `padding` property, and the
classifier must not key on one — a rule that fires on nothing the pipeline can
produce is dead weight that only a synthetic delta could exercise.

The printed order is fixed and stated: Type-A flat (copy the reference value) →
Type-A structural (author the responsive ladder) → Type-B (emergent residual,
which shrinks once Type A is right and must not be set directly). Each group
carries its own count and each row the reference value to transcribe plus the
widths it fires at.

## Verification

Collapse a cell set containing: an author-set value wrong identically at every
width; an author-set value whose reference differs across widths; an author-set
value wrong at only some of the widths present; and an emergent geometry delta.
Assert the classes assigned are flat, structural, structural and emergent
respectively, that no collapsed defect carries section-scoped (`§`) text — the
retired axis produces none — and that the rendered report emits the three groups
in flat → structural → emergent order with per-group counts and the reference
value on each row (a scalar for the flat defect, the `a .. b` ladder range for
the varying one).