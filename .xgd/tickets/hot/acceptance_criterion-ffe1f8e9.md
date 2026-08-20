---
uid: acceptance_criterion-ffe1f8e9
id: AC-1262
type: acceptance_criterion
title: A missing or unreadable change history reads as nothing recorded and never
  fails an edit
created_by: xgd
created_at: '2026-08-20T02:27:25.990477+00:00'
updated_at: '2026-08-20T02:27:25.990477+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

An absent or unreadable change record store degrades to "nothing is recorded" and never to a failure: asking for changes returns an empty list with a zero count rather than an error, and a subsequent write still succeeds and still answers with a count.

## Verification

On a site with a draft but no change history at all, ask for changes and assert an empty list, a count of zero and no error. Then perform a write and assert it succeeds and answers with a count of one.

Corrupt the retained history so it can no longer be interpreted. Assert asking for changes again returns an empty list rather than raising, and that a further write still succeeds and still answers with a count.
