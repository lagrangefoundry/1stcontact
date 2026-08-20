---
uid: acceptance_criterion-d4cc3712
id: AC-1321
type: acceptance_criterion
title: Storage answers every question totally, for a site it holds and one it does
  not
created_by: xgd
created_at: '2026-08-20T05:10:13.236829+00:00'
updated_at: '2026-08-20T05:10:13.236829+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

Storage answers every question it is asked, for every site — including one it holds nothing
for — without ever failing the ask.

For a site the store holds:

- "does this site have a draft" → yes
- "read its definition" → the stored definition object
- "read its pages" → every page in load order, each carrying its store name and its raw
  definition exactly as stored
- "list its assets" → the asset names, sorted
- "read this asset" → the asset's bytes
- "read its change count" → an integer, zero for a site nothing has been written to
- "assemble the current draft" → the assembled-and-validated definition, or the errors that
  stopped it assembling, *reported* rather than thrown, plus a token that is equal if and only
  if the definition is unchanged

For a slug the store holds nothing for, the same questions answer emptily rather than raising:
no draft, no definition, no pages, no assets, a change count of zero, and nothing to assemble.
A directory that exists but holds no definition is therefore not a site with a draft.

Every one of these answers asynchronously, including the ones a filesystem could answer
immediately.

## Verification

Drive each question against a store holding a seeded site and assert the shapes above. Then
drive the identical set against a slug the store has never been given, and assert the empty
answers — no exception, no partially-populated result, and in particular no definition for a
site that was never written. Assert every answer is awaited rather than returned directly, so
a caller cannot come to depend on one of them being immediate.
