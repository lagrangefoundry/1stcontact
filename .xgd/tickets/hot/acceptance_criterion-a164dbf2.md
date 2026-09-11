---
uid: acceptance_criterion-a164dbf2
id: AC-1671
type: acceptance_criterion
title: Below the listing budget the landscape names every document and says it is
  complete
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:45.757056+00:00'
updated_at: '2026-09-11T03:47:45.757056+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

While the listing of a client's corpus fits within the listing budget, the
landscape the assistant is given is a **complete listing**: every document in the
corpus is named, identified by its kind and its identifier, and no document is
omitted or summarised away.

The listing states in words that it is complete — that this is everything there
is, not a summary of it and not a sample — and says how many documents that is.

The build reports itself as the enumerated form, and producing it requires no
describer and costs no model call: it succeeds with none supplied.

## Verification

In a client account holding two documents with distinct titles, build the
landscape with no describer supplied. Assert: the build reports the enumerated
form and a document count of two; both titles appear in the text; the text
states completeness in words ("complete listing", "everything there is"); and no
error is raised for the absent describer. Repeat via the full rebuild-and-publish
path and assert it too reports the enumerated form.
