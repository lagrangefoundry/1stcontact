---
uid: acceptance_criterion-60d226fa
id: AC-1665
type: acceptance_criterion
title: The client's knowledge base opens, indexes and searches inside the deployed
  runtime, which has no filesystem
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:46.971893+00:00'
updated_at: '2026-09-11T03:30:46.971893+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

The client's knowledge base is operable in the deployed runtime, which has no
filesystem: opening it, bringing its index up to date and searching it all
complete there against the account's real records and real private storage. Every
capability the runtime relies on is present in the shared knowledge component it
is assembled against, and the component surface it imports reaches no filesystem
even indirectly.

The runtime's view of that component is untyped, so an upstream rename does not
surface as a build failure — it surfaces as a missing function at the first
search, on a deployment that built and shipped cleanly. The same is true of a
filesystem dependency pulled in transitively.

## Verification

Inside the deployed runtime environment, open a client knowledge base against a
real record store and real private storage, refresh its index and run a search;
assert all three succeed. Separately, assert every name the runtime reaches for is
present in the installed component, and that the component surface the runtime
imports pulls in no filesystem module directly or through a filesystem-bound
entry point.
