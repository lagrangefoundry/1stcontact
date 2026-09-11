---
uid: acceptance_criterion-ff6f99a8
id: AC-1635
type: acceptance_criterion
title: Asking what is built reports the generated references separately from the exported
  documents
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:35:24.783380+00:00'
updated_at: '2026-09-11T02:51:27.504871+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

Asking what is built reports the corpus as its two producers rather than as one
total: how many members were exported from tickets and how many were generated,
as separate counts that sum to the corpus size.

A corpus whose generated references are missing otherwise has exactly the same
shape as one that is merely small, and a generated document has no ticket to be
counted by — so a single total cannot distinguish the two, and the failure would
surface much later as an assistant that does not know what the product does.

## Verification

Build a scratch corpus containing both exported documents and generated
references, then ask what is built: the report states the exported count and the
generated count separately, the generated count equals the number of reference
documents present, and the two sum to the total number of corpus documents.
Delete the generated references and ask again: the generated count is zero while
the exported count is unchanged.