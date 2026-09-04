---
uid: acceptance_criterion-250412ae
id: AC-1525
type: acceptance_criterion
title: A never-indexed client is an ordinary starting state, and the first pass builds
  from nothing
created_by: xgd
created_at: '2026-09-04T03:20:07.793058+00:00'
updated_at: '2026-09-04T03:20:07.793058+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

A client whose knowledge has never been indexed is an ordinary starting state, not an error. With
no index yet stored, the first indexing pass succeeds and builds from nothing, and reading the
not-yet-existing index reports "nothing there" rather than failing. A client with no records at
all indexes successfully to an empty result.

## Verification

For an account with no stored index, ask the index storage for its artefacts: each reads back as
absent, not as an error. Run the first indexing pass for an account holding a small corpus: it
succeeds, and the records are searchable afterwards. Run it for an account holding no corpus
members at all: it succeeds and reports zero documents.
