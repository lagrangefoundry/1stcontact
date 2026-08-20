---
uid: acceptance_criterion-6a13867e
id: AC-1318
type: acceptance_criterion
title: The knowledge grant is read-only and names the system knowledge base on both
  scope axes from one declaration
created_by: xgd
created_at: '2026-08-20T04:42:07.316277+00:00'
updated_at: '2026-08-20T05:03:43.839324+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
The knowledge grant is read-only and is confined to the system knowledge base on
both scope axes at once — what may be searched and what may be read — named a
single time, so the two cannot come to mean different things and a session cannot
read a document it was never allowed to search for. Read-only is enforced by
absence: the offered knowledge operations are exactly the read set, so there is
no corpus-writing operation for the assistant to reach for or to argue about. A
search naming a knowledge base the session was not granted is refused and returns
none of the corpus.

## Verification
With a built knowledge base, list the knowledge operations the assistant is
offered: they are exactly the three read operations — whole-document search,
section search and read-one-document — with nothing that writes, asserted as an
equality so an operation added upstream cannot enter the grant unnoticed. Run a
search naming some other knowledge base: it comes back refused, and its answer
contains no document from the system corpus.