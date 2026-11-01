---
uid: acceptance_criterion-19702fc2
id: AC-2181
type: acceptance_criterion
title: Detail for a person in another business is a 404 identical to an id that does
  not exist
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:37.752655+00:00'
updated_at: '2026-11-01T19:00:37.752655+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
Requesting the detail of a person who exists but belongs to a different business from the caller's scope gives the same response as requesting an id that does not exist: a not-found status with the identical error message ("No such person in this business."). Nothing in the response reveals that the person exists elsewhere. Requesting a person in the caller's own business returns that person's detail.

## Verification
Scoped to business A, request detail for a person id that belongs to business B, and separately for a fabricated id. Assert both return 404 with byte-identical bodies. Request a person in A and assert 200 with that person's record.
