---
uid: acceptance_criterion-6a13867e
id: AC-1318
type: acceptance_criterion
title: The knowledge grant is read-only and names the system knowledge base on both
  scope axes from one declaration
created_by: xgd
created_at: '2026-08-20T04:42:07.316277+00:00'
updated_at: '2026-09-10T22:01:50.939193+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The knowledge grant is read-only and is confined to the system knowledge base on
both scope axes at once — what may be searched and what may be read — named a
single time, so the two cannot come to mean different things and a session cannot
read a document it was never allowed to search for. The set of knowledge
operations a session is offered **is the declaration's read group** — no more and
no less — so an operation the knowledge library adds enters this grant only by
being declared a read, and never by being overlooked. Read-only is enforced by
absence: nothing in that declaration writes, so there is no corpus-writing
operation for the assistant to reach for or to argue about. A search naming a
knowledge base the session was not granted is refused and returns none of the
corpus.

## Verification
With a built knowledge base, list the knowledge operations the assistant is
offered and compare them against the read group of the declaration itself — the
expectation derived from the declaration rather than written out by hand, so the
next operation added upstream is checked here rather than merely noticed. The two
sets are equal and non-empty, and the declaration carries no operation and no
group whose effect is anything but read. Confirm that both scope axes — the
searchable knowledge base and the readable document — are filled from the same
named set. Run a search naming some other knowledge base: it comes back refused,
and its answer contains no document from the system corpus.
