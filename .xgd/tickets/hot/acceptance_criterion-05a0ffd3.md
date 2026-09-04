---
uid: acceptance_criterion-05a0ffd3
id: AC-1583
type: acceptance_criterion
title: 'A file arriving with no answer keeps the rights its provenance already decided:
  the answer narrows, never widens'
created_by: xgd
created_at: '2026-09-04T04:52:11.478991+00:00'
updated_at: '2026-09-04T04:52:11.478991+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

A file that arrives with no answer at all is accepted and keeps exactly the rights its provenance
already decided — the answer narrows those rights and never widens them. An upload with no answer is
recorded as the client's own material, publishable, exactly as it was before the question existed;
material the platform retrieved on the client's behalf remains reading-only whatever answer
accompanies it.

## Verification

Submit an upload with no answer and confirm the recorded rights match those derived from provenance
alone, unchanged from the behaviour of callers that predate the question. Confirm retrieved material
is recorded as reading-only and non-publishable regardless.
