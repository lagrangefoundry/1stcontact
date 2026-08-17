---
uid: request-554ac441
id: REQ-149
type: request
title: 'Publish in the cloud: revisions, history and rendered output without a filesystem'
created_by: xgd
created_at: '2026-08-17T20:14:14.189240+00:00'
updated_at: '2026-08-17T20:14:14.189240+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 13
  depends_on:
  - REQ-143
  - REQ-145
  auto_merge_back: true
  needs_review: false
---

# Publish in the cloud: revisions, history and rendered output without a filesystem

## Why this is its own ticket

[[REQ-145]] moves the builder's routes into workerd. Every route ports through the
`SiteStore` the store chain built — except `/api/publish`, which does not port at
all, because the port has no notion of a revision.

This is not a relocation. It is the design increment [[REQ-142]] and [[REQ-143]]
deliberately left out, and doing it inside REQ-145 would have buried a new storage
contract inside a routing change.

## What publish does today, and why none of it survives the move

`cmdPublish` (`tools/generate/src/cli/commands.ts:183`) is filesystem all the way
down:

| Step | Today | In a Worker |
|---|---|---|
| validate the draft | `loadOrThrow(ctx, slug, 'draft')` | ports — this is the store |
| read lineage | `liveRevision(readHistory(ctx, slug))` | **no equivalent** — history is a file |
| mint the id | `nextRevisionId(ctx, slug)` | **no equivalent** |
| snapshot | `snapshot(ctx, slug)` — copies a directory tree | **no equivalent** |
| diff | `diffSnapshots(prevDir, snap.dir)` — two directories | needs a store-level diff |
| append history | `appendHistory(ctx, slug, {...})` | **no equivalent** |
| re-parent the draft | `writeDraftBase(ctx, slug, id)` | **no equivalent** |
| render | `renderSite(loaded, outDir)` — writes a tree to disk | needs the R2 path |

The `SiteStore` interface covers drafts, pages, assets, the journal and a write
version. It has no revision, no history and no publish verb. `SiteStoreRoot` adds
tenants and `slugs()`; `TenantSiteStore` adds `createDraft` / `forget`. That is the
whole surface.

## The two halves that already exist and should not be rebuilt

**`1c deploy` already ships snapshots to R2** (`tools/generate/src/deploy/`), with a
content-addressed layout and a per-site manifest at `<root>/<slug>/manifest.json`
recording `live`, `revisions[]` and `previews[]` ([[REQ-110]]).

**`public-site` already reads it** (`apps/public-site/src/site-store.ts`), resolving
a channel to an R2 key prefix through a seam whose own comment anticipates this
work: "Phase 2 answers from D1 (`sites` / `revisions` / `pages`) by replacing the
implementation and nothing else."

And `db/migrations/0001_site_store.sql` records the split it expects: "Revision
snapshots likewise stay in R2, where `1c deploy` already writes them."

So the shape is largely decided. Publish mints the revision, deploy ships it; this
ticket is about making the *minting* half exist where there is no disk, and about
whether the two stay separate once both run in the same Worker.

## The questions this ticket has to settle

1. **Where do revisions live?** The migration's answer is D1 rows for the metadata
   (a `revisions` table, which `public-site`'s seam already names) plus R2 for the
   bytes. Confirm against the alternative — manifest-only, no D1 — which keeps one
   source of truth but makes "list history" an R2 read.
2. **Does the port grow publish verbs, or does publish sit above it?** A
   `publish()` on `SiteStore` would have to be implementable by the in-memory
   adapter and the fs adapter too. A publish *service* over the port keeps the port
   small but needs revision storage of its own.
3. **What is a snapshot without a directory?** `diffSnapshots` compares two trees.
   The store-level equivalent is a diff of two definition sets, which is a different
   computation, not a port of the same one.
4. **Do publish and deploy stay two commands?** They are separate today because one
   is local and one is remote. In the Worker both are local to the same bindings.
   Merging them is tempting and may be right — but `--dry-run`, `--prune` and
   `--sandbox` are deploy's, and a merged verb inherits all three.

## Acceptance criteria (provisional)

1. `/api/publish` in the control-app Worker mints a revision, renders it and writes
   it to R2, with no filesystem anywhere on the path.
2. `public-site` serves the resulting revision through its existing seam, unchanged.
3. Publishing twice with no intervening edit is a no-op that returns the same
   revision, matching `1c deploy`'s content-addressed behaviour.
4. Revision history is readable — `basedOn` lineage, message, author, changes — and
   a checkout of an earlier revision is forward-only, as the CLI's is.
5. An invalid draft publishes nothing: the failure happens before any write, as it
   does today.
6. The CLI and the Worker produce the same store state from the same publish, on the
   same store — one implementation, not two.
7. Whatever the answer to question 4, there is exactly one publish implementation
   afterwards; the local path is not left behind as a second code path
   (`CLAUDE.md`: replace fully).

## Origin

Split out of [[REQ-145]] §4, where "which serves `published` after this?" was listed
as an open question. Reading it resolved: everything moves to the cloud. Reading is
cheap — `public-site` already does it — so REQ-145 keeps the read and this ticket
takes the write.
