---
uid: acceptance_criterion-f97ebff9
id: AC-1540
type: acceptance_criterion
title: Every created piece of material is offered to search exactly once, and is findable
  the moment the request returns
created_by: xgd
created_at: '2026-09-04T03:53:35.138668+00:00'
updated_at: '2026-09-04T04:08:23.135916+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

Every piece of material the pipeline creates is offered to the account's search index **exactly
once**, naming that material, and the offer completes before the request is answered.

The consequence is what must be observable: a file is findable by its contents in the account's
knowledge the moment the request that created it returns — no second call, no scheduled pass, no
waiting.

Bringing the new material into the index does not re-read the rest of the corpus: material that was
already indexed is not re-processed by the arrival of a new file.

## Verification

Ingest a file with a counting stand-in for the index step and assert it was called once, with the
new material's identifier, for one created record — and once per record over several ingests, never
zero and never twice.

Then, against an account whose knowledge already holds a document: ingest a second file whose
contents are distinctive, and immediately — with no further call — search the account's knowledge
for that content. Assert the new material is returned. Assert the pre-existing document's stored
index entry was not recomputed by that ingest.