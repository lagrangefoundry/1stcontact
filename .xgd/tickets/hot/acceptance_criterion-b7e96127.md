---
uid: acceptance_criterion-b7e96127
id: AC-1673
type: acceptance_criterion
title: The enumerate/cluster switch is a character budget, not a document count
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:47.675621+00:00'
updated_at: '2026-09-11T03:47:47.675621+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

The switch between listing the corpus in full and clustering it is decided by the
**size of the listing in characters**, never by how many documents there are.

A corpus of only a handful of documents whose entries are long enough to exceed
the listing budget is above the floor and is clustered; a corpus of many more
documents whose entries are short enough to fit remains a complete listing.

## Verification

Measure the listing size for a corpus of four documents with deliberately long
titles and assert it exceeds the budget, while asserting the document count is
well below any plausible count-based threshold (fewer than a dozen). Then build
the landscape for that corpus with a describer supplied and assert it reports the
clustered form. Conversely, build the landscape for a corpus with more documents
but short titles whose measured listing fits the budget, and assert it reports
the enumerated form.
