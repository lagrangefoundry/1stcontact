---
uid: acceptance_criterion-3086ad98
id: AC-1827
type: acceptance_criterion
title: Re-folding re-derives the L1 document and form model from a stored bundle without
  re-hitting the site, on any backing, leaving the retained oracle untouched
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:23.208213+00:00'
updated_at: '2026-09-19T13:37:23.208213+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Re-folding a stored bundle re-derives the folded L1 document and the recovered
form model **from what the bundle already holds**, without going back to the live
site, and behaves identically whichever backing holds the bundle.

For a bundle holding a multi-viewport oracle and a capture record but nothing
derived:

- before the re-fold, the folded L1 document reads as absent;
- after it, both the folded L1 document and the form model are present;
- the result names the bundle it worked on;
- the retained oracle is **unchanged** — a re-fold changes what was derived,
  never what was observed;
- no network request is made to the captured site.

## Verification

Seed a bundle with a synthetic oracle and capture record on the operator's
backing, assert the L1 document reads absent, run the re-fold, then assert the L1
document and the form model are present, the reported bundle name matches, and
the oracle reads back equal to what was seeded. Repeat the whole sequence against
a non-filesystem backing to show the verb never learned which store it had.
