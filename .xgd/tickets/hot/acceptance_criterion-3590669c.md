---
uid: acceptance_criterion-3590669c
id: AC-1317
type: acceptance_criterion
title: The corpus is reachable from the same granted surface as the site operations,
  gated, marked untrusted and audited like an edit
created_by: xgd
created_at: '2026-08-20T04:42:03.244448+00:00'
updated_at: '2026-08-20T04:42:03.244448+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
A conversation opened for a site while a system knowledge base is built offers
the assistant the knowledge operations — search whole documents, search at
section granularity, and read one document in full — **alongside** every site
operation it already had, from one granted surface rather than from a second
route. A knowledge call therefore behaves like any other declared operation: it
is gated by the same grant, its result is marked as untrusted content because a
retrieved document is authored text arriving in the assistant's context, and it
lands in the same audit trail under the same session and role as a change to the
site. Running a search from that surface answers with ranked hits naming the
documents that match.

## Verification
With a built knowledge base, open a conversation for a site and inspect what the
assistant is offered: the knowledge operations are present and the site-changing
and site-reading operations are unchanged. Run a search through that surface for
a phrase a corpus document is about, and the answer names that document. Inspect
the audit trail: the knowledge call is recorded there the same way an edit is, and
the operation's declared result carries the untrusted-content marking.
