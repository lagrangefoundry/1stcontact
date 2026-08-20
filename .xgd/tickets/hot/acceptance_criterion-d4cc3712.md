---
uid: acceptance_criterion-d4cc3712
id: AC-1321
type: acceptance_criterion
title: Storage answers every question totally, for a site it holds and one it does
  not
created_by: xgd
created_at: '2026-08-20T05:10:13.236829+00:00'
updated_at: '2026-08-20T15:59:38.515635+00:00'
completed_at: null
last_field_updated: body
status: active
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
- "record a change" → the count that record produced, with the site's change count standing
  there afterwards. Recording never fails a write: a store that cannot take the record answers
  with the counter unmoved rather than raising.
- "read the changes since a given count" → the records after that count, where the counter
  stands now, and whether the retained window still reaches back that far
- "report what the draft has pending" → the files added, modified and removed against the
  revision the draft descends from, together with which revision that is — or no revision at
  all, when it descends from none
- "assemble the current draft" → the assembled-and-validated definition, or the errors that
  stopped it assembling, *reported* rather than thrown, plus a token that is equal if and only
  if the definition is unchanged

For a slug the store holds nothing for, the same questions answer emptily rather than raising:
no draft, no definition, no pages, no assets, a change count of zero, a recorded change that
leaves the counter unmoved, an empty set of changes standing at zero, nothing pending against no
base revision, and nothing to assemble. A directory that exists but holds no definition is
therefore not a site with a draft.

A store that keeps no revisions answers "what is pending" with every file added against no base
revision — precisely what a site that has never published reports — so that question is total
over a store with no history behind it, without that store claiming a history it does not have.

Every one of these answers asynchronously, including the ones a filesystem could answer
immediately. Applying one whole change is the port's one remaining question and is the subject
of its own criterion; the asynchrony assertion here covers it too.

## Verification

Drive each question against a store holding a seeded site and assert the shapes above, including
the three journal-facing ones: that recording a change answers with the count it produced and
leaves the site's change count standing there; that reading the changes since a given count
returns the records after it, the counter's current position, and whether the window truncated;
and that what the draft has pending names the files and the revision it is measured against.
Then drive the identical set against a slug the store has never been given, and assert the empty
answers — no exception, no partially-populated result, no definition for a site that was never
written, and a recorded change that neither raises nor moves a counter. Assert every answer is
awaited rather than returned directly, so a caller cannot come to depend on one of them being
immediate.
