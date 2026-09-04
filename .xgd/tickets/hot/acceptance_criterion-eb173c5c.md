---
uid: acceptance_criterion-eb173c5c
id: AC-1517
type: acceptance_criterion
title: The deployed assistant reaches the corpus from its own release artifact with
  no filesystem, and the surface and the priming arrive together or not at all
created_by: xgd
created_at: '2026-09-04T03:03:21.853619+00:00'
updated_at: '2026-09-04T03:03:21.853619+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The deployed assistant reaches the system knowledge base from the artifact it was
released with, and from nowhere else. The corpus, the document index and the
section index all travel inside that artifact as values, so a search on the
deployed host touches no filesystem at any point — neither to find a document nor
to rank one — and there is no machine outside the deployment whose disk the answer
depends on. Nothing on the path from a conversation to a ranked hit may reach a
file, and that is a property of the shipped artifact rather than something a
passing turn demonstrates: a filesystem module resolves in that runtime and hands
back per-instance scratch space, so a corpus read from a file would pass a test
and be empty in production.

The knowledge operations and the priming that describes them arrive **together or
not at all**. A conversation is never primed with a map of a corpus it has not
been granted — it would be told to read documents it cannot open — and is never
granted the corpus without the map, which would leave it with a search it has no
reason to believe would find anything. Whichever of the two absent states applies,
both are withheld and the conversation runs on its site operations alone.

## Verification

Take a turn inside the deployed runtime against a release carrying a corpus: the
assistant is offered the knowledge operations and is primed with the corpus map in
the same turn. Take a turn against a release carrying no corpus: neither is
present — no knowledge operation is offered and the priming promises no corpus —
and the turn still completes.

Inspect the shipped artifact rather than a running turn: everything reachable from
the deployed knowledge path is free of filesystem imports, so the corpus the
deployed assistant searches cannot be a file it happened to find.
