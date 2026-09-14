---
uid: acceptance_criterion-fdff2d1d
id: AC-1797
type: acceptance_criterion
title: One search reaches both knowledge bases and returns one list on their own scores,
  cut to k after merging, ties client-first
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:16.885568+00:00'
updated_at: '2026-09-14T06:28:16.885568+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A search made from a conversation reaches **both** knowledge bases and returns
**one** ranked list:

- each knowledge base is searched through its own index and its own material, so
  the full ranking each defines — shortlisting and demotion included — runs
  within it;
- the returned list is ordered by the relevance score each side itself produced;
  the conversation layer does not re-rank, re-weight or re-score, so there is
  exactly one answer to how hits are ordered;
- the union of the two result sets is cut to the requested number of results
  **after** merging, not before, so asking for three over two corpora can return
  two from one side and one from the other;
- two hits with equal scores come back client's-material-first, the same
  precedence the landscape uses.

Restricting a search to a named knowledge base reaches that one only; naming a
knowledge base the conversation was never granted is refused as unknown rather
than answered with an empty result set.

## Verification

With both knowledge bases open and each holding material that answers a query,
run a search from the conversation and confirm the result list interleaves hits
from both sides in descending score order, and that its length is the number of
results requested rather than that number per side. Repeat with two hits of
identical score, one from each side, and confirm the client's comes first.
Restrict the same search to one knowledge base and confirm only its hits return;
restrict it to a name that was never granted and confirm an unknown-knowledge-base
refusal rather than an empty list.
