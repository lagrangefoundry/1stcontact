---
uid: acceptance_criterion-fed3b114
id: AC-526
type: acceptance_criterion
title: Per-element styling fields are compared and disagreements flagged as their
  property
created_by: xgd
created_at: '2026-07-09T22:58:25.687752+00:00'
updated_at: '2026-07-09T22:58:25.687752+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
For each reference text run paired to an actual run, the diff compares colour, font size, font weight, font family, text-fill gradient (direction and stop colours), left-bar border (width and colour), line-height, letter-spacing, and left-padding. A disagreement (beyond tolerance) on any one of these produces a delta whose property names that field, and only fields present on the reference side are compared.

## Verification
Diff a reference against a draft that differs in exactly one styling field at a time; assert a delta of the matching property is emitted for each, and that a field absent from the reference produces no delta.
