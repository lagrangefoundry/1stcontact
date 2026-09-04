---
uid: acceptance_criterion-7f1cffcc
id: AC-1541
type: acceptance_criterion
title: A deployment that cannot index still keeps the file, tells the caller it is
  unfindable, and says so loudly to its operator
created_by: xgd
created_at: '2026-09-04T03:53:36.233952+00:00'
updated_at: '2026-09-04T04:08:22.992472+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

On a deployment where nothing can index — the facility that produces search entries is not
configured — an ingestion still succeeds and still keeps the file. The failure is invisibility, not
loss, and it is never silent:

- The answer to the request states that the material was not indexed, so the surface that sent the
  file can say "stored, but nothing has read it yet" without asking again.
- The deployment emits a warning naming the material that was stored, stating that nothing will
  find it by search, and naming the configuration that is missing.

Where indexing *is* configured, the same answer states that the material was indexed.

## Verification

Ingest a file on a deployment with no indexing facility configured. Assert the request succeeds,
that the material record and its bytes exist afterwards, that the answer reports the material as
not indexed, and that a warning was emitted carrying the material's identifier and naming the
missing configuration. Ingest the same file with indexing configured and assert the answer reports
it as indexed and no such warning is emitted.