---
uid: acceptance_criterion-646952b8
id: AC-1652
type: acceptance_criterion
title: The deployed session is primed with the map and granted a read-only surface
  confined to the system knowledge base on both axes
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:13:12.172796+00:00'
updated_at: '2026-09-11T03:13:12.172796+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

A conversation opened on the **deployed runtime** with a knowledge base present is
handed two things together: a priming that is the **map and not the pile**, and a
knowledge grant that is **read-only and confined to the system knowledge base on
both scope axes** — what may be searched, and what may be read.

The priming names the corpus's territories and, for each, where to start reading;
it does **not** carry the body text of the documents it describes, so adding
documents to the corpus does not grow the primed context. The role's stated
purpose — what this assistant should go looking for in the corpus — is declared
once and read by both hosts, so the deployed assistant and the operator's own
cannot come to be looking for different things.

The grant is read-only **by absence**: the knowledge operations the deployed
session is offered are exactly the read set — whole-document search, section
search, and read-one-document — with nothing that writes to the corpus for the
assistant to reach for. And they arrive **beside** the site-changing operations
rather than instead of them, from one surface, which is what makes a knowledge
call gated, marked and audited by the same machinery an edit is rather than
reaching the model by a second route. The scope axes are filled from the same
declaration the corpus was built against rather than from a name written out
here, so a second knowledge base can be added later without either axis being
widened by accident.

## Verification

Inside the deployed runtime, with a corpus planted for the purpose, open a
conversation and run a turn. Inspect what the session was primed with: it contains
a territory heading from the map and the identifier of a document the map routes
to, and it does **not** contain that document's body text. Inspect the operations
the session was offered in the same turn: a site-changing operation is present,
and the knowledge operations present are **exactly** the three read operations —
asserted as an equality, so an operation added upstream cannot enter the grant
unnoticed. Inspect the grant the surface travels with: it names the system
knowledge base and no other.
