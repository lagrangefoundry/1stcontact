---
uid: acceptance_criterion-9926d333
id: AC-1293
type: acceptance_criterion
title: Asking what is built reports the corpus against the marked tickets and each
  artefact as built or missing, and is what the bare command does
created_by: xgd
created_at: '2026-08-20T04:16:35.061943+00:00'
updated_at: '2026-09-04T02:15:19.467351+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Asking what is built reports the corpus and each artefact: the number of documents in the corpus (counting the documents only — the generated map is not one of them), and whether each of the document index, the passage index and the map is built or missing. Asking with no form named at all reports the same thing, so the bare command is safe and answers rather than acting.

The corpus is reported **against what it should hold**: the same line carries the number of documents the ticket store says belong in the knowledge base — those carrying the membership kind — and there are three distinguishable outcomes:

- **agreement** — the two numbers match, and the line says so, naming the marker being counted;
- **disagreement** — the line warns, states how many documents carry the marker, and names the remedy (re-run the export), because a corpus quietly smaller than intended is the failure this report exists to make visible;
- **unknown** — when the ticket store cannot be read at all, that side is reported as *not checkable* rather than as zero. Zero is a real and alarming answer, and manufacturing it from an unrelated failure would send an operator to rebuild a corpus that was never broken.

On a tree where nothing has been built, it reports zero documents and all three artefacts missing rather than failing.

## Verification

Query the report against three trees — nothing built, corpus only, fully built — and assert the artefact values in each. Confirm that a corpus containing the generated map alongside its documents still reports the document count without the map, and that the bare command with no form named produces the same report. Assert the three corpus outcomes separately: a store whose marked documents match the corpus, a store with more marked documents than the corpus holds (warned, with the remedy named), and a store that cannot be read (reported as unknown, and not as zero, with the rest of the report still produced).
