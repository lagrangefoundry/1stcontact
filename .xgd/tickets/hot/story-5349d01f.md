---
uid: story-5349d01f
id: STORY-94
type: story
title: 'Publish a site to shared storage: one revision-minting publish, driven from
  the builder and the command line'
created_by: xgd
created_at: '2026-08-06T18:38:28.628910+00:00'
updated_at: '2026-08-31T11:36:11.326601+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-e0143ffa
  capability_uid: capability-a12e557f
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-0385746c
  - bundle-b3b7c399
  uat_coverage: pass
---

## Story

**As a** site operator, **I want** publishing to freeze my draft as a numbered
revision and put its rendered output into shared storage — from the builder's
toolbar or from one command — **so that** someone other than me can see the
site, pressing publish twice costs nothing, and nothing I published before is
ever destroyed.

## Description

This story is the operator half of delivery — the act of shipping. The visitor
half (what a URL serves) is a separate story in the same capability.

Publishing no longer happens on the operator's machine. It happens wherever the
site's storage is: the builder's publish call and the command line are two
callers of one publish, and that publish reaches storage only through the store
port, so it runs against the operator's filesystem and against the cloud store
without knowing which it was handed.

In scope:

- **One publish, two front doors.** The builder's publish request and the
  operator's publish command produce the same store state from the same draft.
  There is exactly one implementation and no second handler behind the builder's
  route — the local transport used to answer publish itself, and that was the
  one route where the two front doors disagreed about what a route does.
- **No filesystem on the cloud path.** Minting the revision, freezing the
  definition, rendering, and recording the entry all happen through storage
  verbs, so the whole publish runs inside the edge runtime.
- **Validate first, write nothing on failure.** An invalid draft publishes
  nothing at all — not a revision, not a log entry, not a byte of output — and
  the failure names which fields are wrong rather than reporting "publish
  failed".
- **An unchanged draft mints nothing.** Publishing a draft that matches the live
  revision returns the live revision and records no new one, because publish is
  a toolbar button and buttons get pressed twice. Re-publishing unchanged with a
  new message therefore changes nothing, message included.
- **The artifact is complete.** What is stored is both the rendered output *and*
  the frozen definition it was rendered from. This is now load-bearing for a
  different reason than it was: the mutable draft lives in the database, so the
  frozen definition beside the render is the only copy of what the site looked
  like at that revision — which is what makes a checkout possible at all.
- **History is readable and forward-only.** Every revision carries its lineage,
  message, author, per-path change list and an audit digest. Checking out an
  earlier revision re-parents the draft onto it rather than rewinding the log, so
  the next publish mints a new highest revision and records what it descended
  from. A revision is never removed, renumbered or reused.
- **A published address belongs to whoever claimed it first.** The public URL
  grammar carries no account, so the first publish of a slug claims it and a
  second account publishing the same slug is refused before any byte is written,
  leaving the live site untouched.

Out of scope: what a URL serves — including where the live revision is read from
and how the builder's published view reaches it — belongs to the serving story
in the same capability. Per-account hostnames and custom domains remain deferred.

## Technical Context

- **Publishing is a sequence over storage verbs, not a storage verb.** The store
  port carries the storage a publish needs — read the log, freeze a revision with
  its content, read one back, read and set the draft's lineage pointer — and the
  order those happen in lives in exactly one place above the port. Putting a
  publish verb *on* the port would have put the sequence inside every adapter,
  making "one implementation" something to maintain rather than something that
  cannot be otherwise.
- **The change list is canonical, not byte-for-byte.** Two stores hold the same
  definition in different shapes, so comparing what each happens to serialise to
  would make "did this page change?" depend on which store answered. Comparison
  is over the definition with keys ordered, which is what makes "the same publish
  produces the same store state on either store" true rather than approximately
  true.
- **The audit digest is not an address.** A revision is named by its number, and
  every stored key and public URL is built from that. The digest answers only the
  question a change list cannot — are these the same bytes? — across two stores.
- **What was removed, and why it was removed rather than ported.** The
  content-addressed deploy command is gone entirely, and with it: the draft and
  published deploy channels, snapshot identity as a digest of contents, the
  per-store-tree deploy index and its concurrent-writer refusal, the "shipped but
  not publicly reachable" report, the dry run, and the prune. Shipping a
  revision's bytes and recording it live is what publish itself now does with
  both storage bindings in hand. Prune has no home once the command is gone;
  bytes orphaned by an interrupted publish are unreachable, because the recorded
  revision is what vouches for them, and cost only storage.
- **Draft preview snapshots are dropped, not ported.** The shareable
  digest-addressed draft links were backed by the per-site index that has been
  deleted, so they could not remain while revisions moved without leaving exactly
  the half-migrated split the project forbids. The builder's own draft preview is
  unaffected; sharing a draft returns later as a builder control.

## Reconciliation Decisions

Recorded 2026-08-31 during reconciliation of BUNDLE-20 (REQ-149). These formalise
behaviour the implementation settled where the intent was silent, and are
decisions taken now rather than open questions.

1. **A publish against the operator's filesystem store also refreshes the local
   published output directory**, at the path the local serve, screenshot and
   fidelity loops already read, and the publish command reports that location.
   The intent specified where a revision is frozen and did not say what happens
   to the operator's local rendered tree; keeping the local loop fed is what the
   implementation chose, and it is observable at the command line, so it is
   stated in AC rather than left to be discovered.
2. **The publish command's no-op is reported distinctly** — an unchanged draft is
   reported as already published at its existing revision, rather than printing a
   revision number an operator would reasonably read as newly minted. The intent
   named the no-op; it did not name how it reads.
3. **Assets travel into both halves of a revision.** The frozen definition holds
   the asset bytes as they were, and the rendered output carries its own copy, so
   a published page whose images resolved only while the draft still held them
   cannot decay. The intent said the artifact is complete; which halves carry
   assets was left open.

## Dependencies

The store port and its cloud adapter (the revision storage verbs are part of that
port), and the builder origin that hosts the publish route. Pairs with the
serving story, which reads what this one records.

## Story Points

3