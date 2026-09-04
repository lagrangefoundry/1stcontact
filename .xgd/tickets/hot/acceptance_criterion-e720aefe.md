---
uid: acceptance_criterion-e720aefe
id: AC-1535
type: acceptance_criterion
title: A client who has given us nothing yet is told so in words, not shown an empty
  landscape
created_by: xgd
created_at: '2026-09-04T03:36:54.898935+00:00'
updated_at: '2026-09-04T03:36:54.898935+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

A client who has given the platform nothing yet gets a landscape that says so in words, not an empty
document and not a failure. It states that nothing has been uploaded, captured or decided for this
client, that there is therefore nothing here to search, and that what is needed should simply be
asked for. It reports a corpus of zero documents and is produced as the listing form, with no
description capability needed.

## Verification

Build the landscape for a client whose corpus is empty. Observe it succeeds, reports zero documents
and the listing form, and that the body states in words that there is nothing here yet and invites
asking rather than searching. Observe no description capability was required.
