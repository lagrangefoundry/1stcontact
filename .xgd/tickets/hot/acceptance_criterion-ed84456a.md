---
uid: acceptance_criterion-ed84456a
id: AC-1660
type: acceptance_criterion
title: One account's search returns nothing belonging to another, over the records
  and the vectors alike
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:36.459426+00:00'
updated_at: '2026-09-11T03:43:39.951760+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

A search of one account's knowledge returns only that account's records. Given
two accounts each holding material of their own, the identical query run for the
second account does not return the first account's document — not as a low-ranked
hit, not at all — and the derived vectors are partitioned the same way, each
account's index content residing only under that account's own location.

Both halves are the barrier. Isolating the records while sharing an index would
still hand one client a body snippet of another client's positioning paper,
because a search result carries an excerpt of what it matched.

## Verification

Create two accounts, record a distinctive document under the first, bring both
indexes up to date, and run the same query bound to each. Assert the first
account's search returns its document and the second account's search does not
contain it. Then list the stored index content for each account and assert every
object of the second account's index lies under the second account's own
location, and that the first account's index is non-empty under its own.