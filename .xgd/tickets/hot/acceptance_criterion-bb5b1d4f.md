---
uid: acceptance_criterion-bb5b1d4f
id: AC-1510
type: acceptance_criterion
title: A definition or value set is stated only against the shape it was written for,
  never pooled across shapes
created_by: xgd
created_at: '2026-09-04T02:27:14.040750+00:00'
updated_at: '2026-09-04T02:27:14.040750+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

A definition stated in a reference is stated only against the shape it was written for. Where a term is defined once — against one element kind or one shape — and left undefined on the other shapes that happen to use the same field name, the reference gives that definition against the shape it belongs to and gives none against the others; it never repeats a meaning written for one shape as though it were authoritative for another.

The same rule holds for permitted values: each element kind's value sets are stated against that kind, rather than pooled into one vocabulary that would claim every shape accepts every value.

## Verification

Find a field name that appears on several shapes in the page vocabulary and is defined against only one of them. Assert the generated layout reference carries that definition under the shape it was written for, and that the same sentence does not appear against the other shapes carrying that field name. For value sets, assert that a value permitted for one element kind is not listed as permitted for a kind that does not accept it.
