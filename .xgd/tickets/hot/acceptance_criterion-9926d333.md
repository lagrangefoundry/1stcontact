---
uid: acceptance_criterion-9926d333
id: AC-1293
type: acceptance_criterion
title: Asking what is built reports the corpus size and each artefact as built or
  missing, and is what the bare command does
created_by: xgd
created_at: '2026-08-20T04:16:35.061943+00:00'
updated_at: '2026-08-20T04:37:27.954323+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Asking what is built reports four facts: the number of documents in the corpus (counting the documents only — the generated map is not one of them), and whether each of the document index, the passage index and the map is built or missing. Asking with no form named at all reports the same thing, so the bare command is safe and answers rather than acting.

On a tree where nothing has been built, it reports zero documents and all three artefacts missing rather than failing.

## Verification

Query the report against three trees — nothing built, corpus only, fully built — and assert the four values in each. Confirm that a corpus containing the generated map alongside its documents still reports the document count without the map, and that the bare command with no form named produces the same report.