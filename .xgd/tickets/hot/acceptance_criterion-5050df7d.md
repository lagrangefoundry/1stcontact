---
uid: acceptance_criterion-5050df7d
id: AC-1651
type: acceptance_criterion
title: A conversation on the deployed runtime answers from a design document, names
  it, and ranks it above one that does not answer
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:13:08.060157+00:00'
updated_at: '2026-09-11T03:24:29.212214+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

A conversation served from the **deployed runtime** can read the system's own
design documents. Asked a question whose answer appears nowhere but in one of
them, the assistant answers **from that document** and **names it**, so the
operator gets an attribution rather than an assertion.

This is the sentence the whole mechanism exists to make true, and it carries a
third claim that keeps it from being vacuous: the answer is **ranked**, not
merely returned. The document that actually answers the question is placed ahead
of one that does not — a search handing back the whole corpus in corpus order
would satisfy "from the document" and "names it" exactly as well while having
retrieved nothing.

The corpus it reaches is the one packed into the application build, so the
reaching happens with **no filesystem and no network fetch on the query path** —
the deployed runtime has no disk to fall back to, which is what makes reaching
the documents there evidence that the packed corpus is what was read. Each
document arrives carrying the last-changed stamp it was indexed under rather than
a default, so the corpus the session sees is not dated differently from the index
it is ranked against.

(The guarantee that the shipped artifact reaches no filesystem module at all is
AC-1406's, asserted over the import graph; this criterion does not restate it.)

## Verification

Inside the deployed runtime, with a corpus planted for the purpose — a document
carrying a fact that exists nowhere else, and a second document on an unrelated
subject — open a conversation for a site and run a turn asking for that fact.
Assert the streamed answer contains the planted fact, names the document it came
from, names it **before** the unrelated document, and carries the stamp the
corpus was indexed under. Compose the answer from what the host actually
retrieved rather than from a scripted sentence, so the assertion can only hold if
the fact travelled out of the corpus, through the search, and into the model's
context.