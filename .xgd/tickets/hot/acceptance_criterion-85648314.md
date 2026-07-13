---
uid: acceptance_criterion-85648314
id: AC-623
type: acceptance_criterion
title: Adjacent same-type sibling lists merge on normalization
created_by: xgd
created_at: '2026-07-13T21:00:43.911693+00:00'
updated_at: '2026-07-13T21:00:43.911693+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
Two adjacent sibling lists of the same ordered-ness are indistinguishable in the notation and normalize into a single list block (retaining the first list's start), mirroring the merging of adjacent identically-formatted inline runs. This is what makes the round-trip invariant hold for a document that authored two adjacent same-type lists.

## Verification
Construct a document with two adjacent same-type lists, normalize (or round-trip) it, and assert a single merged list block whose items are the concatenation and whose start is the first list's.
