---
uid: story-fde7370b
id: STORY-121
type: story
title: 'Cloudflare Site Store: Definitions In A Database, Bytes In An Object Store,
  Scoped To One Account'
created_by: xgd
created_at: '2026-08-31T09:45:24.792019+00:00'
updated_at: '2026-08-31T10:04:11.582815+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-b3b7c399
  capability_uid: capability-c4c7a854
  story_kind: feature
  story_points: 3
---

## Story

**As a** platform operator whose builder must one day run with no machine of mine behind it,
**I want** a second live implementation of the site store that keeps site definitions, pages and
the change log in a database and asset bytes in an object store, scoped so that a handle can only
ever see one account, refusing a write that was computed against a site that has since moved and
leaving nothing behind when it refuses,
**so that** the editing surface can be driven from a runtime with no filesystem at all, with a
multi-file change that either lands whole or does not land, and with one account's sites
unreachable from another's by construction rather than by a query everyone has to remember to
filter.

## Description

The operator's sites live in a directory tree on their own machine. This story is the store that
lets them live somewhere a Worker can reach: **the same set of storage questions, answered by a
database and an object store instead of by files.**

**The split, by kind.** Page definitions and the site definition are small, structured and
transactional, so they are database rows. Asset *bytes* are binary and are held in the object
store, with the database keeping only what makes an asset listable and typed. Nothing about that
split reaches a caller: the editing surface asks the same questions and gets the same answers.

**One account per handle, decided once.** The account is the hard information barrier. A store is
obtained *for* an account, and every question the resulting handle answers is already scoped —
**no operation takes an account as an argument**, so there is no call site at which the wrong one
could be supplied, and reaching another account's data requires deliberately obtaining a second
handle, which is visible in a diff. Two accounts may each hold a site called `home` and neither
can see the other's. An account that does not exist, or exists and is not active, is refused when
the handle is asked for, with a typed error naming it — because a handle that reads nothing is
indistinguishable from an account that has no sites yet.

**A write can be conditional, and a refusal costs nothing.** Every interesting edit is a
read-modify-write, and the update it can lose sits between the read and the write — a window only
the caller can name. So a change may carry the site version it was computed against. Carried and
still current, the change lands and the version advances. Carried and stale, the change is refused
with an error stating both what the writer expected and what the site actually holds, **and
nothing at all is left behind**: no page written, no definition changed, no version bump. Of two
writers racing from the same version, exactly one survives. Omit the expectation and the write is
unconditional, as it has always been.

**Honesty about which store can promise that.** The filesystem store applies a change as a
sequence of writes with nothing to attach a condition to. It therefore takes a change carrying an
expectation and applies it unconditionally, rather than performing a check-then-write that would
*look* like a guarantee while leaving the race exactly as open as before. A caller gets a genuine
refusal or none at all, never a reassuring one that does not hold.

**Bytes are bytes.** An asset written to this store comes back byte-for-byte, including a sequence
that is not valid text, carrying the content type its name implies — the same content type the
operator's own file server gives that extension, from one table rather than two that drift. A name
that would climb out of the site's assets answers *not found*, exactly as the filesystem store
answers it.

**Moving a site between stores is one question asked and one change written.** A site's whole draft
— definition, every page, every asset's bytes — can be copied from any store into any other. It
crosses as a single whole change, so against the transactional store an import lands whole or not
at all; a half-landed import would be worse than a failed one, because the site would exist,
validate as far as it went, and be missing pages nobody had a record of.

**And the two stores cannot drift, because there is one set of questions.** The same body of
assertions is run against the filesystem store, the filesystem-free in-memory store, and the
cloud store inside the Workers runtime against real database and object-store bindings. A site
imported into the cloud store assembles to the same validated definition as the store it came
from, and renders to byte-identical output.

### In scope

- A store that answers every declared storage question with a database and an object store behind
  it, reachable from a runtime with no filesystem.
- Account scoping bound into the handle at the moment it is obtained; a refusal for an unknown or
  inactive account.
- A readable site version, a conditional write that refuses on a stale expectation carrying both
  versions, and the guarantee that a refused multi-part write leaves nothing behind.
- The filesystem store's stated non-guarantee for the same conditional write.
- Asset bytes round-tripping with their content type, and the refusal for a name that leaves the
  assets namespace, on both the read and the write path.
- Copying one site's whole draft from any store to any other, as one whole change.
- One body of storage assertions run against all three stores.
- The whole structured editing surface completing inside the Workers runtime.
- The database and object-store bindings declared for both the default and the named deployment
  environment, and the schema applied by the deploy before the application is uploaded.

### Out of scope

- **Any production caller.** This story ships the store, its schema, the copy path and the
  bindings. The command line still runs on the filesystem and the builder is still a proxy — the
  relocation of the builder origin is its own story.
- **Publishing, checkout and revision history**, which remain filesystem-backed here and move in
  their own story. This store reports every file as pending against no base, which is exactly what
  a site that has never published reports.
- **Migrating the operator's existing site tree.** The copy path is what will do it; running it is
  not part of this.
- **Deployed remote behaviour.** Everything is proved inside the Workers runtime against real
  local bindings; latency, database limits and bindings in a live deployed Worker remain a stated,
  bounded unknown.
- **What a change record contains and what the change count means** — CAP-99's; this story owns
  only that those questions answer over a store with no filesystem.

## Technical Context

**Relationship to existing capabilities.** This is the second adapter behind the port STORY-118
(`story-3f4a5f2b`) established. That story deliberately placed "the Cloudflare store itself" out
of its own scope and named that separation as the reason its correctness claim was checkable at
all — so this is a new story inside CAP-101 rather than an extension of that one, and it is
emphatically not a parallel port. It sits underneath CAP-86 (Structured Copy Editing) and CAP-99
(Draft Change Journal) in exactly the way the filesystem adapter does. CAP-82 (Site Delivery)
owns published bytes, which are a different question.

**Multi-file atomicity is a gain here, not parity.** STORY-118 recorded that the filesystem store
is *not* atomic across a whole change and improved that nowhere. This store is, because a whole
change is one transaction. That is the first thing the one-call write shape ever bought.

**Why a refused write must still have executed its writes.** The conditional guard is deliberately
evaluated with the change's own writes already in the transaction and no earlier short-circuit.
A caller-side pre-check would sit two round trips away from the transaction, so it would refuse
the easy cases and leave the genuinely concurrent one open — and it would mean a refused write
never reached the store at all, making the "nothing was left behind" claim vacuous. Any
reimplementation must preserve the property that a refusal is a rollback of work that really
happened, not a rejection before the work was attempted.

**The byte/metadata ordering is chosen, not incidental.** Bytes are written before the row that
makes an asset listable, because the two stores cannot be made atomic with each other. The chosen
failure is an object with no row — invisible, costing only storage — over a row with no object,
which lists as a present asset and then 404s.

**The unblocker this story carried.** The editing surface could not load in the Workers runtime at
all, and storage was not the reason: importing the framework's main entry pulled in components
that no Worker bundle can resolve, which made the importer node-only transitively and silently.
A second, transform-free framework entry is what makes "the editing surface completes in the
Workers runtime" assertable rather than aspirational. It is infrastructure for this story's
claim, not a capability of its own.

**Known limit of the evidence.** Two of the port's assertions — the ones that render a draft —
stay in the host runtime alone. Not because of the database, which serves them fine, but because
the render at this point still goes through a build transform the Workers runtime has none of.
That is a **named exception** rather than a silent absence, and it is discharged by the story that
relocates the render.

**No contradiction between intent and code was found for this item.** Every behaviour formalized
below traces to REQ-143's ticket body or its implementation record.

## Reconciliation Decisions

- **The store's own site-admin surface** (decided at reconciliation, 2026-08-31): REQ-143
  describes the storage port and the schema, but is silent on how a site comes to *exist* in the
  cloud store. The landed code gives the scoped handle its own admin verbs — make an empty draft,
  list this account's sites, drop a site and its bytes — deliberately outside the port, because no
  editing *command* creates a site. Formalizing this is not optional bookkeeping: without it a
  copy has nowhere to land, so the copy path's refusal of a destination that does not hold the
  site would be unobservable. Formalized as part of the account-isolation and copy-path criteria
  below.

- **An unsafe asset name on the *write* path is dropped, not raised** (decided at reconciliation,
  2026-08-31): REQ-143 names the traversal refusal for reading an asset ("refused as on the
  filesystem") and is silent on what a *write* naming one should do. The landed code stores
  nothing under such a name and carries the rest of the change through. That is the right shape
  and is formalized rather than left implicit: a whole change is one call, and failing the entire
  change because one asset name was malformed would discard the caller's other edits; the
  observable end state is identical to the filesystem's, which is that no such asset exists.
  Formalized as the write half of the unsafe-name criterion.

## Dependencies

None.

## Story Points

3