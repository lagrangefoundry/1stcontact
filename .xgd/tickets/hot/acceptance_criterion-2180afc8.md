---
uid: acceptance_criterion-2180afc8
id: AC-1449
type: acceptance_criterion
title: A workspace deployed against a store holding only the schema serves, registering
  the one account its own configuration names and no other
created_by: xgd
created_at: '2026-08-31T16:51:21.306585+00:00'
updated_at: '2026-08-31T17:00:43.975400+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A workspace deployed against a store that has been migrated and never written to
— the schema is there, no account is registered — **serves**. The first request
that needs the store registers the one account the deployment's own configuration
names, and then proceeds: the site listing answers successfully and empty, rather
than reporting the service as unavailable.

That is the state every newly deployed workspace and every newly created store is
in. Refusing it left the workspace dead on arrival, because the chrome waits on
the site listing before it will mount anything: an operator saw a boot guard, and
the only cure was for someone to copy a site up from a laptop.

Four properties bound what the cold start may do:

- **Exactly that account, and no other.** The name registered is the one the
  deployment already carries in its own configuration. Nothing in a request can
  choose it or reach a different one. Afterwards that account exists and is
  active, and the store holds exactly one more account than before.
- **Any route that needs the store, not one privileged route.** The registration
  is a property of opening the store, so it happens on whichever route first
  needs one — a read as readily as a copy-up.
- **It resolves *not yet*, never *no*.** An account that exists and has been
  deactivated is not registered past: that refusal stands and the account is
  still deactivated afterwards. A deployment that names no account registers
  nothing at all.
- **It costs nothing once done.** After the account exists, an ordinary request
  performs the same single account lookup it always did and writes nothing; the
  registration happens once in a store's life, not once per request.

## Verification

Against a store holding the schema and no account row, ask the workspace as an
admitted caller for the site listing. Assert the response is a success and the
body is an empty list — not the service failure it used to be, and not a blank
page. Read the store's accounts back and assert the configured account is present
and active, and that exactly one account was added.

Repeat the cold start against a second, equally fresh account name, driving a
route that copies a site up rather than one that reads. Assert the copy lands and
that account is registered too, so the bootstrap belongs to opening the store
rather than to one route.

Assert the two refusals are untouched by it: a deployment naming an account that
exists and is deactivated is still refused and the account is still deactivated
afterwards; a deployment naming no account is still reported as the missing
configuration setting and creates nothing.

Each case must use an account name of its own — the bootstrap is a write, so
sharing one across cases would let the order in which they run decide which of
them saw a fresh store, which is the property under test.