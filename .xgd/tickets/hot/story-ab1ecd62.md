---
uid: story-ab1ecd62
id: STORY-126
type: story
title: 'Product Ticket Store: The Client''s Material In A Database, Scoped To One
  Account, Standing On The Component''s Own Schema'
created_by: xgd
created_at: '2026-09-01T23:56:31.229073+00:00'
updated_at: '2026-09-01T23:59:10.058275+00:00'
completed_at: null
last_field_updated: body
status: unplanned
fields:
  intent_uid: request-13a5e206
  capability_uid: capability-dfb0a4ff
  story_kind: feature
  story_points: 3
---

## Story

**As a** platform operator running the builder for one client account,
**I want** a second store beside the site store that holds everything a site is made *from* —
the client's uploads, the background the assistant fetched, the capture bundles, the per-site
brief and the conversations — as tickets in the platform's database, stood up by a schema step
that stays provably in agreement with the component that owns that schema, and reached through
a single wiring point that refuses a misconfigured deployment when the store is built and binds
the account into the handle it returns,
**so that** client material finally has somewhere to live, one account's material is unreachable
from another's by construction rather than by a filter every call site has to remember, and a
deployment that could not have stored a file says so at start-up rather than months later when a
client uploads one.

## Description

The platform's memory has two halves and until now only one existed. The site store holds *sites*:
page definitions, the site definition, published revisions. This story is the other half — the
material a site is built from, held as tickets.

**The schema arrives as a migration, and it is not ours.** The ticketing component owns this DDL and
publishes it; the deployment's migration runner reads schema files off disk and cannot import it, so
it is transcribed into a migration alongside the site store's, applied by the same runner in the same
sequence. A transcription is a fork unless something checks it, so the agreement between the two is
itself asserted: an upstream schema change fails this repository's suite rather than silently leaving
a deployed database a version behind.

**One account registry serves both stores.** The site store already recorded which accounts exist and
whether they are active. A second registry would be two places for one fact that could disagree about
whether an account is suspended — a security property, not bookkeeping — so the ticket store's schema
step reconciles the existing registry rather than creating a rival, adding the one field the ticket
store writes and the site store's original table lacks.

**One wiring point, and it refuses a deployment it cannot serve.** A store is obtained *for* the
account the deployment is configured for. The account is bound into the handle at that moment, so no
operation takes an account as an argument and no call site is given the chance to supply the wrong one;
the scoped handle is also terminal, so holding one account's store conveys no reach into another's.
Obtaining a store fails immediately, with a named error saying what is missing and where to declare it,
when the deployment names no account or gives attachment bytes nowhere to go.

**A freshly migrated database is not a dead builder.** A handle is refused for an account the registry
has never heard of, and a database that has just been migrated has an empty registry. The configured
account is therefore registered on demand — but only after a read proves it absent, because the
registration write overwrites status and an unconditional one would reactivate a suspended account on
the next request.

In scope: the schema step and its agreement with the component; the shared account registry's
reconciliation; obtaining a store and the refusals that come with it; the account barrier on ticket
rows; and resolving the shared component from any checkout, including a linked worktree, so the store
is reachable at build time at all.

Out of scope: the vocabulary of ticket types themselves (a separate story on this capability); the
bucket attachment bytes are kept in and the disclosure boundary around it (a separate story); any HTTP
surface over these tickets, which belongs to REQ-161 and which this intent explicitly excludes;
ingestion, which creates material and is not defined here; migrating existing chat sessions into the
store; and the knowledge base built over these types (REQ-159).

## Technical Context

- **Two stores, not one, and the second proves its own barrier.** Several claims here rhyme with
  claims already made about the site store (one account per handle, no operation takes an account, an
  unusable account refused when the handle is asked for). They are claims about different tables in a
  different store: asserting the site store's isolation proves nothing about this one, which is why
  this barrier is asserted again against a real database rather than argued from the resemblance.
  Related: CAP-101 (Site Storage Port) and STORY-121 (Cloudflare Site Store) hold the site half.
- **The construction-time refusal is this platform's decision, not the component's.** The intent's
  acceptance list asked for a store that fails at construction when it has nowhere to put bytes; the
  component deliberately does the opposite, treating attachments as an optional capability and
  refusing them at first call, which is correct for a general component that cannot know whether its
  host has bytes to store. The intent body itself settles this — enforcement belongs at this
  platform's wiring layer, and the component's own policy stays as upstream wrote it. There is no
  contradiction between intent and code to fix here; the resolution is the operator's, recorded in the
  intent.
- **Build-time resolution is a repository hazard, not a novelty.** A bare package specifier for the
  shared component resolves by walking up from the importing file, which finds the shared install from
  the main checkout and finds nothing from a linked worktree. The same trap was already paid for by
  the assistant library, and the same remedy applies: the specifier is resolved once at build time and
  written out as a generated re-export carrying an absolute path.
- **Two claims here were mutation-tested rather than argued.** Removing the registry reconciliation
  from the schema step fails 13 of the 15 runtime acceptance tests, which is how it is known to be
  load-bearing rather than decorative.
- **An operator obligation no criterion can carry.** The attachment bucket must be created before the
  next production deploy; the local runtime conjures it and the platform does not. Recorded on the
  intent and on this capability's blob-storage story, not assertable here.

## Reconciliation Decisions

- **The schema-agreement check** (decided at reconciliation, 2026-09-01): the intent says the
  component's schema arrives as a migration; it is silent on anything verifying that the transcription
  has not drifted from its source. The landed code asserts every published statement appears in the
  migration, and without that assertion the migration is a fork that would deploy a database a version
  behind an upstream change with nothing reporting it. Formalized as AC-1477; this is reconciliation
  closing a gap in the original spec, not an operator request.
- **Register-if-absent account bootstrap** (decided at reconciliation, 2026-09-01): the intent's
  acceptance list is silent on how the account comes to exist in the registry, and a freshly migrated
  database has an empty one — a handle would be refused and the builder dead on arrival. The landed code
  registers the configured account only after a read proves it absent, because the registration write
  overwrites status. Formalized as AC-1480; the read-before-write half is formalized because without
  it account suspension becomes a suggestion, which is a security property and not an implementation
  detail.
- **Stale-install reporting** (decided at reconciliation, 2026-09-01): the intent's implementation notes
  cover generating the shim but are silent on what happens when the shared install is present yet
  predates the capability the store needs — the state that actually blocked the work. The landed code
  decides presence by the file the capability lives in rather than by a package version that never
  changes, and reports a named skip carrying the command that fixes it. Formalized as part of AC-1485.

## Dependencies

None.

## Story Points

3
