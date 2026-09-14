---
uid: acceptance_criterion-d8c01624
id: AC-1800
type: acceptance_criterion
title: An arrival notice above its budget truncates titles and never the count, naming
  the oldest arrivals and how many more there are
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:28.728215+00:00'
updated_at: '2026-09-14T06:28:28.728215+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

When more material arrives than can be named within the notice's character
budget, the **count stays exact and complete** and the **titles are what get
truncated**: the notice reports the true number of documents that arrived, names
as many of them as the budget allows — oldest first, so the surviving titles are
the ones the conversation is most likely already about — and says how many more
there are.

The whole notice stays bounded in length regardless of how many documents
arrived, so a bulk import cannot reintroduce the pile that priming exists to
avoid. The magnitude is never what is dropped, because it is the one thing that
cannot be recovered by searching.

## Verification

Present forty-one arrivals whose titles together far exceed the budget, and
inspect the resulting notice:

- it states forty-one documents, exactly;
- it quotes a sample of titles, including the oldest arrival's;
- it states how many further documents are unnamed;
- its total length stays within a small constant of the budget rather than
  growing with the number of arrivals.
