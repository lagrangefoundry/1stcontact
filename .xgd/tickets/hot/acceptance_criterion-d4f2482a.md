---
uid: acceptance_criterion-d4f2482a
id: AC-1252
type: acceptance_criterion
title: 'The surface states the cost of removal and rename from the counts it shows:
  removal unavailable in use with the count as its reason, rename naming the uses
  it will rewrite first'
created_by: xgd
created_at: '2026-08-20T01:59:50.879531+00:00'
updated_at: '2026-08-20T01:59:50.879531+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

The surface states the consequences of the two edits that turn on usage, from the same counts it
labels its swatches with:

- the removal control is offered and enabled on an entry nothing references, and is present but
  unavailable on an entry in use, giving the usage count as the reason and saying what to do instead
  — it is shown rather than hidden, because "why can't I remove this" is exactly the question the
  count exists to answer;
- the rename control states how many uses the rename will rewrite **before** it is run, and that
  number is the same number the entry's swatch shows and the same number the completed rename
  reports rewriting.

The unavailable control is an explanation of a rule, never the rule itself: the store refuses the
same removal regardless of what the surface displayed.

## Verification

Select an unreferenced entry and observe the removal control enabled with a note saying it is safe
to remove. Select an entry referenced several times and observe the removal control present and
disabled, its note naming the usage count and pointing at the alternative. Observe the rename
control's note naming the same count, and after running the rename observe the confirmation naming
that same number of references rewritten. Finally submit the refused removal directly to the store
as a stale client would and observe it refused there too, with the surface's display having had no
bearing on the outcome.
