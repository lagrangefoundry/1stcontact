---
uid: acceptance_criterion-c8ca5afa
id: AC-1299
type: acceptance_criterion
title: An unchanged document is not rewritten and an unchanged corpus is not re-embedded
created_by: xgd
created_at: '2026-08-20T04:16:55.837485+00:00'
updated_at: '2026-08-20T04:16:55.837485+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A rebuild costs what the *change* costs, not what the corpus costs:

- Re-exporting a document whose content has not changed leaves its file untouched — its modification stamp is identical before and after — because the stamp is what the incremental index reads as "when this document last actually changed".
- Rebuilding the index over a corpus that has not changed reports the full document count and **zero** newly embedded documents.

## Verification

Export, record a sampled document's modification stamp, export again, and assert the stamp is unchanged. Separately, build the index over a corpus, build it again with nothing altered, and assert the second build reports the same total document count and zero embedded.
