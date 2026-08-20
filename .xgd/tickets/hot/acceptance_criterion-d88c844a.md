---
uid: acceptance_criterion-d88c844a
id: AC-1301
type: acceptance_criterion
title: A document is found by describing what it is about, without knowing its id,
  filename or title
created_by: xgd
created_at: '2026-08-20T04:16:58.186432+00:00'
updated_at: '2026-08-20T04:16:58.186432+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A reader that knows neither a document's id, nor its filename, nor its title can still reach it by describing, in ordinary words, what it wants — and the document it wants comes back first.

This is the property the whole capability exists for: searching the built knowledge base with a natural-language question about a subject one document covers returns that document as the top result.

## Verification

Build over a corpus of a few documents with clearly separate subjects, search it with a question phrased in words that appear in none of the documents' titles or ids, and assert at least one result is returned and that the highest-ranked one is the document that actually covers the subject.
