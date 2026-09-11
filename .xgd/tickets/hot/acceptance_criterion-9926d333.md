---
uid: acceptance_criterion-9926d333
id: AC-1293
type: acceptance_criterion
title: Asking what is built reports the corpus against the ticket count and each artefact
  as built or missing, and is what the bare command does
created_by: xgd
created_at: '2026-08-20T04:16:35.061943+00:00'
updated_at: '2026-09-10T08:04:17.909517+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Asking what is built reports four facts: the number of documents in the corpus (counting the documents only — the generated map is not one of them), and whether each of the document index, the passage index and the map is built or missing. Asking with no form named at all reports the same thing, so the bare command is safe and answers rather than acting.

The corpus number is never reported alone. It is reported **against the number of documents the store says should be there** — the count of tickets carrying the membership kind — because a bare count cannot show truncation: 37 documents looks exactly as healthy as 38 unless something says what the number was supposed to be. The corpus line therefore takes one of three shapes:

- **agreement** — the corpus size, stated as being *of* that many tickets carrying the membership kind
- **disagreement** — the corpus size, marked as a warning, saying how many tickets carry the kind and naming the command that repairs it (`1c kb export`); the corpus is called stale rather than merely different
- **unknown** — when the ticket store cannot be read at all, the corpus size followed by a statement that the store is unreadable and the check could not run. It is **never reported as zero tickets**: zero is a real and alarming answer, and manufacturing it from an unrelated failure would send an operator to rebuild a corpus that was never broken.

An unreadable store degrades this report rather than failing it; the export and the build still fail loudly on the same condition.

On a tree where nothing has been built, it reports zero documents and all three artefacts missing rather than failing.

## Verification

Query the report against three trees — nothing built, corpus only, fully built — and assert the four values in each. Confirm that a corpus containing the generated map alongside its documents still reports the document count without the map, and that the bare command with no form named produces the same report. Assert each of the three corpus-line shapes: a corpus that agrees with the store, a corpus short of it (warning present, repair command named), and a store that cannot be read (unknown, and not zero).
