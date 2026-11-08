---
uid: acceptance_criterion-cbf10c68
id: AC-2473
type: acceptance_criterion
title: The embedder handed out reports the model's name and dimension and returns
  its vectors untouched
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:06:07.858598+00:00'
updated_at: '2026-11-08T21:06:07.858598+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

Naming failures does not change what an embedder is. The embedder each knowledge
base receives reports the same model name and the same vector dimension as the
underlying Workers AI embedder. On success it returns exactly the vectors the
model returned, unaltered.

The index build sizes its vectors from the dimension, and search refuses an index
built by another model by its name. An embedder that lost either would turn a
legibility fix into the model-comparability corruption the single-model rule
exists to prevent.

## Verification

Wrap an inner embedder with a known name, dimension and fixed vectors. Assert the
embedder handed out reports the same name and dimension, and returns the inner
vectors for a successful call. Assert that an index built through it records the
shipped model's name and dimension.
