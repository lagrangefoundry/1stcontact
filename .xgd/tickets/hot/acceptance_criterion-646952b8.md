---
uid: acceptance_criterion-646952b8
id: AC-1652
type: acceptance_criterion
title: The deployed session is primed with the map and granted a read-only surface
  confined to the system knowledge base on both axes
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:13:12.172796+00:00'
updated_at: '2026-09-11T08:56:50.935343+00:00'
completed_at: null
last_field_updated: body
status: active
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
session is offered are exactly the ones the grant names, and every one of them is
declared a read — there is nothing that writes to the corpus for the assistant to
reach for. And they arrive **beside** the site-changing operations rather than
instead of them, from one surface, which is what makes a knowledge call gated,
marked and audited by the same machinery an edit is rather than reaching the model
by a second route. The scope axes are filled from the same declaration the corpus
was built against rather than from a name written out here, so a second knowledge
base can be added later without either axis being widened by accident.

**Which operations those are is not this repository's to choose.** The read set is
read out of the shared knowledge component's own declaration, and that declaration
may add a read operation with no commit here — as it did, widening the read group
from three operations to five (`KnowledgeOutline` and `KnowledgeChanges`, both
declared `effect: read`). A read-only addition is not a widening of what this
session may do, so the criterion is the **property**, not the roster: every
operation granted is a declared read, every group granted is a declared read
group, and the session is offered exactly the operations the grant names — no more
and no fewer.

## Verification

Inside the deployed runtime, with a corpus planted for the purpose, open a
conversation and run a turn. Inspect what the session was primed with: it contains
a territory heading from the map and the identifier of a document the map routes
to, and it does **not** contain that document's body text.

Inspect the operations the session was offered in the same turn: a site-changing
operation is present, and the knowledge operations present are **exactly** the
operations the grant names, resolved through the surface's own declaration and
asserted as an equality — so neither an operation the grant does not name, nor an
undeclared operation wearing the surface's naming, can enter unnoticed. Read the
declaration off the surface the session actually travelled with rather than from a
separately imported copy. Assert that the granted set is non-empty and that every
operation in it is declared, then that **every** granted operation declares
`effect: read` and **every** granted group is a declared read group — the property
the roster equality used to stand proxy for, and strictly stronger than it, since
a write operation arriving inside an already-granted group fails it.

Inspect the grant the surface travels with: on **every** scope axis the
declaration defines — not merely the two that exist today — it names the system
knowledge base and no other.
