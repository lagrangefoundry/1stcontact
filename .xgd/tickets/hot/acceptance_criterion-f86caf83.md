---
uid: acceptance_criterion-f86caf83
id: AC-1283
type: acceptance_criterion
title: An unlocked control carries no explanation and is not marked unavailable, because
  there is nothing to explain
created_by: xgd
created_at: '2026-08-20T03:39:04.402129+00:00'
updated_at: '2026-08-20T03:39:56.201881+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A control the surface does **not** declare unavailable carries no explanation
under it and is not marked as unavailable in any way. It opens, it stages, it
saves — an ordinary colour row on an ordinary run of copy asks the palette for a
colour exactly as it always does.

This is the other half of the locking rule rather than a restatement of it. A
note under every row would make the rows that matter invisible, and a row dressed
as unavailable when nothing is wrong is a control the operator will stop trying.
An explanation appears only where there is something to explain.

## Verification

Open the dialog over a run of copy whose controls the surface declares nothing
about, and — on a page where another run's identical control **is** locked — over
both. Assert the ordinary row is not marked unavailable, carries no explanatory
text under it, can be operated, and reaches the palette when it is; assert the
locked one beside it is unaffected by the ordinary one and vice versa.