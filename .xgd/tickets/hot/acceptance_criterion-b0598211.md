---
uid: acceptance_criterion-b0598211
id: AC-1686
type: acceptance_criterion
title: New material is searchable the moment the ingestion returns, without re-processing
  the material already indexed
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:08:11.116557+00:00'
updated_at: '2026-09-11T04:17:56.598418+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

Newly ingested material is retrievable by search **the moment the ingestion returns**, and
making it so does not re-process the material already indexed.

Against an account whose knowledge already holds indexed material: after one ingestion, a
search phrased in the words of the new file returns it, and the work performed to achieve
that is proportional to what changed — the previously indexed material is not re-embedded.

## Verification

Index an account's existing material and record how much embedding work that took. Ingest a
new file with distinctive content, then search for it and assert the new material is among
the hits and is attributed to the client's own knowledge base. Assert that embedding work
increased (the new material was processed) and that the increase is a small fraction of the
initial cost rather than a repeat of it (the old material was not). Counting on the embedder
rather than on a tally the pipeline reports is what makes "without a full reindex" a
measured claim.