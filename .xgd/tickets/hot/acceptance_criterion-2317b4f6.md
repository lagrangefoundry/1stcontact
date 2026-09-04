---
uid: acceptance_criterion-2317b4f6
id: AC-1532
type: acceptance_criterion
title: The line between listing and clustering is a character budget over the entries,
  not a document count
created_by: xgd
created_at: '2026-09-04T03:36:44.088817+00:00'
updated_at: '2026-09-04T03:46:50.997087+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

The line between listing the corpus and clustering it is a **character budget over the listing
itself**, not a count of documents. A handful of documents whose entries together exceed the budget
is over the line and is clustered into described territories; a larger number of documents whose
entries together fit is under the line and is listed in full. The measure is the size of the entries
alone, so unrelated prose in the surrounding landscape — a heading, a description of the knowledge
base — cannot move the line.

## Verification

Build the landscape for a corpus of only four documents whose titles are long enough that their
entries exceed the budget, and observe it is measured as over the budget and produced in the
clustered form. Build it for a corpus of more documents than that whose short titles fit inside the
budget, and observe it is produced as a complete listing. Lengthen only the surrounding, non-entry
prose and observe the measurement against the budget does not change.