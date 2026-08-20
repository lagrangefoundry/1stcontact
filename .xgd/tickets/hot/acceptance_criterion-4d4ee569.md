---
uid: acceptance_criterion-4d4ee569
id: AC-1292
type: acceptance_criterion
title: The corpus can be built alone, with no model and no credentials, and still
  leaves a coherent tree
created_by: xgd
created_at: '2026-08-20T04:16:33.966110+00:00'
updated_at: '2026-08-20T04:16:33.966110+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Asking for the corpus alone produces the documents and the knowledge base's declaration, and nothing else — no index, no passage index, no map. It reports how many documents were written, where they were written, and (when there are any) which documents were removed and which were left out.

It reaches no model and requires no credentials of any kind: with the embedding and describing credentials entirely absent from the environment, the corpus-only form still succeeds.

## Verification

Run the corpus-only form with no model credentials present and assert it succeeds, that the corpus directory holds one file per opted-in document, that the declaration exists beside it, that neither index directory nor the map was created, and that the reported counts match what is on disk.
