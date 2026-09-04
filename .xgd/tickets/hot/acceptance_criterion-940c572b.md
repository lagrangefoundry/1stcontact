---
uid: acceptance_criterion-940c572b
id: AC-1521
type: acceptance_criterion
title: Keeping the index current costs only what changed, and a new record is searchable
  off that pass
created_by: xgd
created_at: '2026-09-04T03:19:49.447378+00:00'
updated_at: '2026-09-04T03:19:49.447378+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

Bringing a client's index up to date processes only what has actually changed since the previous
pass:

- indexing a corpus of N previously unindexed records computes N embeddings;
- adding one record and refreshing computes exactly one further embedding and retains the other
  N, reporting N+1 documents present and N retained;
- refreshing again with nothing changed computes no document embeddings at all and still reports
  every record present.

The newly added record is searchable immediately off that incremental pass alone — no full
rebuild is needed to find it, and there is no "reindex everything" step in normal running.

## Verification

With a counter on the embedding step, index two records (two embeddings), add a third and refresh
(one further embedding, two retained, three documents), then search for text unique to the third
record and find it. Refresh once more with no change: zero document embeddings, three retained.
The counts are read from the counter on the embedding step itself, not from a tally the refresh
reports about itself.
