---
uid: acceptance_criterion-5be44790
id: AC-1821
type: acceptance_criterion
title: A member a bundle does not hold reads as absent, the form model and asset list
  read empty, and a missing capture record is refused by name
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:36:57.200123+00:00'
updated_at: '2026-09-19T13:36:57.200123+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Reading a member a bundle does not hold is an answer, not a fault, on every
backing:

- an arbitrary member key that was never written reads as **absent**;
- the multi-viewport oracle, the folded L1 document and the structural hints each
  read as **absent** when the bundle predates them;
- the recovered form model and the mirrored-asset list each read as **empty**,
  because "this page has no behaviours" and "this page mirrored no media" are
  honest readings rather than missing artifacts;
- the member key listing of a bundle holding nothing is **empty**;
- the capture record is the one member a bundle cannot be without: its absence is
  **refused with an error naming the bundle**, rather than surfacing as a parse
  failure on nothing.

## Verification

Take a handle on a bundle that was never written and, on each backing, assert:
an unwritten member key reads absent; the oracle, L1 document and hints read
absent; the form model and asset list read empty; the member listing is empty;
and reading the capture record rejects with a message containing the bundle's
own name.
