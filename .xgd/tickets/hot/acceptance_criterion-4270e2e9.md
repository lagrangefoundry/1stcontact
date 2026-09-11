---
uid: acceptance_criterion-4270e2e9
id: AC-1675
type: acceptance_criterion
title: A client who has given us nothing yet is told so in words
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:55.136772+00:00'
updated_at: '2026-09-11T04:01:56.308293+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

A client who has given us nothing yet gets a landscape that says so in words: that
nothing has been uploaded, captured or decided for this client, that there is
therefore nothing here to search, and that the assistant should ask for what it
needs — rather than a bare heading with an empty list beneath it.

The build reports the enumerated form with a document count of zero, and requires
no describer.

## Verification

Build the landscape for a client account whose corpus holds no documents, with no
describer supplied. Assert: it succeeds; it reports the enumerated form and zero
documents; the text states that nothing has been uploaded, captured or decided
and that there is nothing to search; and the text contains no entries.