---
uid: acceptance_criterion-2f220b03
id: AC-1506
type: acceptance_criterion
title: Each corpus producer removes only its own stale documents, in whichever order
  the two run
created_by: xgd
created_at: '2026-09-04T02:26:56.458730+00:00'
updated_at: '2026-09-04T02:26:56.458730+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

The corpus has two producers — one deriving documents from the ticket store, one generating them from sources of truth — and each removes only the documents it is responsible for. A document whose ticket has been withdrawn is deleted; a generated reference that is no longer produced is deleted; and neither producer deletes anything belonging to the other, in whichever order the two run.

Getting this wrong rots the corpus in either direction: a stale document spared by both sweeps stays searchable and confidently wrong forever, and a live document swept by the wrong producer leaves the assistant silently missing part of what it knows.

## Verification

Into a corpus holding both kinds of document, plant one stale document of each kind — one whose originating ticket no longer exists, and one generated reference that is no longer produced. Run both producers, in each order. Assert each producer removes exactly its own stale document, that both stale documents are gone once both have run, and that every live document of both kinds is still present.
