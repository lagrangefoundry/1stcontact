---
uid: acceptance_criterion-ec2f5080
id: AC-1511
type: acceptance_criterion
title: The control-surface reference describes the whole declared surface, not one
  role's grant
created_by: xgd
created_at: '2026-09-04T02:27:18.568278+00:00'
updated_at: '2026-09-04T02:27:18.568278+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

The control-surface reference describes the whole declared surface — every operation that exists, not the subset any one session was granted — with, for each, what it takes (each parameter's kind and whether it is required), what it returns, and the ways it can be refused. Where the declaration groups operations, orders them into sequences, or records something as deliberately impossible, the reference carries those too, and an operation belonging to no group is still described rather than dropped.

The reference answers "what can this product do", which is a question about the surface. It is not the instructions a session is primed with, which describe only the operations that session was given.

## Verification

Read the generated control-surface reference and assert every operation the surface declares is described, in both directions — nothing described that is not declared, nothing declared left out — including any operation that belongs to no group. For one operation, assert its parameters appear with their kinds and required/optional status, its return shape appears, and its refusal cases appear. Assert an operation that is granted to no role is nonetheless described, and that anything the declaration records as deliberately impossible is stated as a decision rather than omitted.
