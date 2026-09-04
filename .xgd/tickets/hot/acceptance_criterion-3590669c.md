---
uid: acceptance_criterion-3590669c
id: AC-1317
type: acceptance_criterion
title: The corpus is reachable from the same granted surface as the site operations
  on either host, gated, marked untrusted and audited like an edit
created_by: xgd
created_at: '2026-08-20T04:42:03.244448+00:00'
updated_at: '2026-09-04T03:03:11.957749+00:00'
completed_at: null
last_field_updated: title
status: active
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
documents that match, and the document that answers the question outranks the
one that merely mentions it.

This holds on **both** hosts and not only on the operator's own machine. Where a
conversation runs on the deployed host, the corpus it searches travels with the
release rather than being read from a machine the host cannot see, so the same
knowledge operations are offered from the same granted surface there, and a hit
carries the document's identity and the time that document last changed — the
stamp the index it was ranked against was built from, not a placeholder the
reader supplied.

## Verification
With a built knowledge base, open a conversation for a site and inspect what the
assistant is offered: the knowledge operations are present and the site-changing
and site-reading operations are unchanged. Run a search through that surface for
a phrase a corpus document is about, and the answer names that document. Inspect
the audit trail: the knowledge call is recorded there the same way an edit is, and
the operation's declared result carries the untrusted-content marking.

Then do the same inside the deployed runtime, with a corpus carried in the
artifact it was released with and no filesystem available to it: open a
conversation, take a turn asking a question whose answer appears only in one
planted document, and the assistant's answer states that fact, names that
document, places it ahead of a corpus document that does not answer the question,
and carries that document's own last-changed time rather than a default stamp.
