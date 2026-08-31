---
uid: request-554ac441
id: REQ-149
type: request
title: 'Publish in the cloud: revisions, history and rendered output without a filesystem'
created_by: xgd
created_at: '2026-08-17T20:14:14.189240+00:00'
updated_at: '2026-08-31T14:22:34.874054+00:00'
completed_at: '2026-08-31T14:22:34.874054+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 13
  depends_on:
  - REQ-143
  - REQ-145
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 54b3e76a84d005134884728dee80bacab93f83c1
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 0e390334e49f33f94bc2c948a62a532c03ea84eb
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 932f362e4f60b8797557ba8f4cdd1fddeb1c9068
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 92fc26e7bcc2a941999ba0e55292cda6b092bd26
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: ec144c856ed1840d23e4f1443dfddf4fb0ef2d67
    reconcile_sha: null
    main_sha: null
  - working_sha: 02bd443784f6a1202cd5b1807a12dc52d012628f
    reconcile_sha: null
    main_sha: null
  version: 0.2.9
  bundled_in: bundle-b3b7c399
  chat_comment: comment-98e86f10
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

`cmdPublish` (`tools/generate/src/cli/commands.ts:154`) is filesystem all the way
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

## Where publish already half-exists

`/api/publish` is already a seam with three parties leaning on it and nothing
behind it:

- the builder UI already POSTs it (`apps/control-app/src/builder/api.js:228`);
- the shared route table already has the path, `501`-ing and naming this ticket
  (`apps/control-app/src/router.ts:257`);
- the Node transport **intercepts it before delegating**, and answers with a
  bespoke `cmdPublish` call on the filesystem
  (`tools/generate/src/cli/builder.ts:366`).

That interception is the second code path AC-7 names. `builder.ts` is otherwise a
*transport* — `node:http` in, `Request`/`Response` out, into the same `route()` the
deployed Worker calls — so publish is the one route where the two front doors
disagree about what a route does. Closing that is the shape of this ticket.

`1c deploy` (`tools/generate/src/deploy/`) already ships snapshots to R2 under a
content-addressed layout with a per-site `manifest.json` recording `live`,
`revisions[]` and `previews[]` ([[REQ-110]]), and `public-site` already reads it
(`apps/public-site/src/site-store.ts`). Both change here — see D5 and D6.

## Decisions

### D1 — publishing an unchanged draft is a no-op

Publish computes the diff against live anyway; when it is empty, return the live
revision and mint nothing. The CLI mints unconditionally today, so this is a
visible behaviour change, adopted because publish becomes a toolbar button
([[DOC-28]] §10) and buttons get pressed twice. Forward-only is unaffected: a
draft checked out from an earlier revision differs from live, so the diff is
non-empty and publish mints.

Consequence: re-publishing an unchanged draft with a new `-m` message does
nothing, message included. [[DOC-12]] §5 states the opposite and needs one
sentence.

### D2 — published slugs are globally unique, claimed on first publish

The draft side is tenanted to the bone (`draft/<tenant>/<slug>/...`, every D1 row
keyed `(tenant_id, slug)`); the published side predates it and has no tenant
anywhere (`sites/<slug>/...`, `/site/<slug>/`). Until now the writer was `1c deploy`
on the operator's laptop; this ticket makes the writer a multi-tenant Worker, so
tenant B publishing `home` would overwrite tenant A's live site.

Resolved by a claim table rather than by putting the tenant in the key: the public
URL grammar and [[DOC-12]] §7's R2 layout are untouched, and `public-site` needs
no slug-to-tenant read on the hot path beyond the one row it already has to fetch.
Per-tenant hostnames remain the real long-term answer and stay deferred
([[DOC-12]] §9).

### D3 — migration `0002` adds the revision record and the draft's lineage pointer

The `sites` table has no lineage column and there is no revisions table. Both are
needed. See "Schema" below.

### D4 — `/preview/<slug>/published` redirects to `public-site`

`302` to the public URL. One serving path for published bytes, as [[DOC-12]] §7
assigns it. Cost: a never-published site shows `public-site`'s 404 rather than a
builder-shaped message. The alternative — proxying — duplicates the resolve-and-
serve logic that seam exists to own. The route is reachable mainly by hand-typed
URL; [[DOC-28]] §10's toolbar has no published mode.

### D5 — D1 is the only record; `manifest.json` is deleted

The manifest was never a hot-path optimisation — `public-site` caches every 200 in
the edge Cache API (`apps/public-site/src/index.ts:52`), so the store is touched
only on a cold miss. Its own seam comment already promises the swap: "Phase 2
answers from D1 (`sites` / `revisions` / `pages`) by replacing the implementation
and nothing else." AC-2's "unchanged" is about the *seam*, which is the interface,
and it stays unchanged.

The manifest is carrying four jobs, which all have homes:

| Job | Moves to |
|---|---|
| which revision is live | derived — `MAX(id)` over the revisions table |
| vouching for a URL-supplied sha before it becomes an R2 key | a row lookup, same guarantee |
| GC roots for `--prune` | D1 rows |
| deploy's "already deployed" check | publish's own no-op check (D1) |

`live` is **derived, never stored**: [[DOC-12]] §4 is explicit ("No `head` field —
live = highest id") and §10 already made [[REQ-7]] drop `published_revision_id` for
this reason. Storing it would reintroduce the duplication the model rejected once.

R2 keeps bytes and nothing authoritative. `source/` still ships beside `out/`,
because D1 holds only the *mutable* draft — R2's `source/` is the only copy of what
the definition looked like at revision N, which is what makes checkout possible.
That is not duplication; nothing else holds that fact.

### D6 — one publish implementation, called two ways; `1c deploy` is deleted

Publish is a service function over the port, called by the `/api/publish` route
handler and by `1c publish`. The CLI does not become an HTTP client — it does not
need to, because the endpoint already runs inside it (the Node transport), and
calling the service directly keeps `1c publish` a one-shot command with no server
dependency. The transport's bespoke interception is deleted.

The port grows revision **storage** verbs (read history, append a revision, write
and read a snapshot), not a `publish()` verb, so the algorithm exists once above
two adapters — the [[REQ-142]]/[[REQ-143]] pattern already in place for drafts.
This is not duplicated data: a given site lives in exactly one store, and each
store keeps its own record (`history.json` on disk, rows in the cloud).

`1c deploy` is deleted rather than ported. Its whole job — ship a revision's bytes,
record it live — is what publish now does inside the Worker with both bindings in
hand. This is AC-7 in its literal sense.

### D7 — draft preview snapshots are dropped, not ported

The sha-addressed shareable draft links at `/site/<slug>/draft/<sha>/`
([[DOC-12]] §5.1) are manifest-backed, so they cannot stay behind while revisions
move — a half-manifest would be exactly the legacy-mode split `CLAUDE.md` forbids.
They are delivered only by `1c deploy`, and the CLI is a dev and test surface, not
a product one. The real feature returns later as a "Share draft" button in the
builder toolbar.

The builder's own draft preview (`/preview/<slug>/draft/`, behind Access) is
unaffected — that is [[REQ-145]] and stays live.

## Schema (migration `0002`)

```sql
ALTER TABLE sites ADD COLUMN base_revision INTEGER;   -- D3: the draft's lineage pointer

CREATE TABLE site_revisions (                          -- immutable once written; live = MAX(id)
  tenant_id, slug, id INTEGER,
  published_at, published_by, message,
  based_on INTEGER,        -- DOC-12 section 4: set when the draft was checked out from a non-latest revision
  changes TEXT,            -- the per-path diff, as DOC-12 section 4 defines it
  sha TEXT,                -- audit, not addressing
  PRIMARY KEY (tenant_id, slug, id)
);

CREATE TABLE published_sites (                         -- D2: the PK *is* the uniqueness guarantee
  slug TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_published_at TEXT NOT NULL
);
```

## Scope

- migration `0002` (above);
- revision storage verbs on the store port, implemented by the fs adapter (over
  `revisions/` + `history.json`, largely existing) and the D1/R2 adapter (new);
- a `publish()` service over the port: validate, diff, no-op or mint, snapshot,
  render, record, re-parent;
- `/api/publish` in the shared route table; the Node transport's interception
  deleted;
- render-to-store, so the Worker can write `out/` without a filesystem;
- `public-site`'s store swapped onto D1 behind its existing seam;
- `/preview/<slug>/published` redirects (`302`);
- `/api/sites` reports the live revision instead of `latest: null`
  (`router.ts:327`);
- `1c deploy` and preview snapshots deleted;
- [[DOC-12]] section 5 amended for D1, section 5.1 for D7.

## Acceptance criteria

1. `/api/publish` in the control-app Worker mints a revision, renders it and writes
   it to R2, with no filesystem anywhere on the path.
2. `public-site` serves the resulting revision through its existing seam — the
   interface unchanged, the implementation reading D1.
3. Publishing twice with no intervening edit is a no-op that returns the same
   revision.
4. Revision history is readable — `basedOn` lineage, message, author, changes — and
   a checkout of an earlier revision is forward-only, as the CLI's is.
5. An invalid draft publishes nothing: the failure happens before any write, as it
   does today.
6. The CLI and the Worker produce the same store state from the same publish, on the
   same store — one implementation, not two.
7. There is exactly one publish implementation afterwards, and no second route
   handler for it: the Node transport's `/api/publish` interception and
   `1c deploy` are gone (`CLAUDE.md`: replace fully).
8. A second tenant cannot publish over a slug another tenant has claimed; the
   attempt fails and the live site is untouched.
9. No site's live revision is recorded in two places: `manifest.json` no longer
   exists and `live` is derived, never stored.

## Out of scope / deferred

- **`--prune` has no home** once deploy is deleted. Orphaned bytes from an
  interrupted publish are unreachable and cost only storage; a Worker maintenance
  route later.
- **The R2 `sandbox/` root becomes dead weight** — only the Worker writes R2 now,
  and it only ever writes its own tenant's real sites.
- **Per-tenant hostnames** (subdomains, custom domains) remain [[DOC-12]] section 9's
  deferred, additive work.
- **Copying asset bytes is get-then-put.** The Workers R2 binding has no
  server-side copy, so a full snapshot ([[DOC-12]] section 8) reads each asset into
  the isolate and writes it back on every publish. Fine at current sizes; the one
  place publish could get slow on an image-heavy site.
- **[[DOC-8]] is stale** — [[DOC-28]] cites 3.2, 4.1 and 13 Q3, none of which
  exist in the stored document, which still commits to in-browser rendering that
  [[DOC-12]] section 11 withdrew. Does not block this ticket.

## Origin

Split out of [[REQ-145]] section 4, where "which serves `published` after this?" was
listed as an open question. Reading it resolved: everything moves to the cloud.
Reading is cheap — `public-site` already does it — so REQ-145 keeps the read and
this ticket takes the write.


## Implementation notes (as landed)

The seven decisions above all held. Five things the implementation settled that
the ticket did not anticipate:

**The port grew storage verbs, not a `publish()` verb.** `revisions`,
`writeRevision`, `readRevision`, `draftBase`, `setDraftBase` — and
`publish/publish.ts` sequences them. A `publish()` on the port would have put the
sequence inside every adapter and made AC-6 a thing to maintain rather than a
thing that cannot be otherwise.

**`pendingChanges` left the port.** It had three implementations, all of them the
same computation over different storage; it is now one service function over the
revision verbs. `snapshot.ts` and `diff.ts` (directory-based) are deleted with it.

**The diff is canonical, not byte-for-byte.** `diffSnapshots` now compares
key-sorted JSON rather than file bytes, because the two stores hold the same
definition in different shapes — comparing what each happens to serialize to
would make "did this page change?" depend on which adapter answered. This is what
makes AC-6 true rather than approximately true.

**`RevisionEntry` gained `sha`.** Audit, not addressing, as the schema said —
computed over the canonical snapshot listing via `crypto.subtle`, so both
adapters record the same value for the same definition.

**`publish` moved into the worker-safe toolbox core.** It was Node-only because
it snapshotted a directory tree; that reason is gone, so the AI operation works
against whichever store the host has. `add_asset` is now the only Node-only
operation, and REQ-146's AC-7 UAT was restated around it.

### One finding the suite caught

The first cut of the `/api/publish` handler built its 409 body locally, outside
the router's single scrubbing point. REQ-146's "every error path out of the
router is scrubbed" UAT failed on it. Both non-500 outcomes — `SlugClaimedError`
and `InvalidDefinitionError` — are now mapped in the bottom catch, where the
scrubber is, rather than at the route.

`InvalidDefinitionError` needed a 400 branch of its own: it is not a
`CommandError`, and it carries a LIST of path-pointed errors that flattening to a
single code/path/hint would discard.

### Test changes

Deleted (they test removed features): `req110-r2-deploy`,
`reconciliation-deploy-snapshot`, `reconciliation-serve-deployed-snapshot`,
`bug31-sandbox-r2-namespace`, `reconciliation-servable-root-confinement`.

Rewritten over a shared fixture (`tests/fixtures/published-site.ts`) that runs a
REAL publish and only relocates its output into a fake bucket, at keys the shared
key builders decide: `req111-public-site-serving`,
`req113-worker-extensionless-urls`, `reconciliation-clean-page-urls`.

Added: `test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts` — eight UATs
covering AC-1 through AC-9 inside workerd, against real D1 and R2, driving both
Workers' own `fetch`. control-app publishes; public-site serves what it
published.

`test_UAT_FC_REQ-145_deferred_capabilities_answer_501_naming_their_ticket` is
deleted: publish was the last deferral, and the test's own note said a route
graduating was expected to leave. `notImplemented()` went with it.

### Latent behaviour noticed, not changed

`/site/<slug>/<dir>/` resolves to the key `<dir>`, not `<dir>/index.html` — only
the SITE ROOT gets the index mapping. Predates this ticket; a nested directory
URL has never served an index page. Not touched here.

### Verification

- workers project: 57/57 pass (7 files).
- node project: failing-file set byte-identical to the pre-change baseline (10
  files, all pre-existing: webui components not installed, a wrangler registry
  EPERM, and `bin/build` wiping `dist-assets` mid-run). 1736 pass.
- every package typechecks; control-app's pre-existing `node:fs` type-resolution
  errors are unchanged in number and identity.


## Follow-up: the builder must not fail silently

Found while demoing the landed work: on a store with no tenant row, the builder
serves a **blank page with no visible error**, and the same blank page appears
when `dist-assets` is missing. Three different faults, one indistinguishable
symptom, and the reason only ever reachable in devtools.

### Why it happens

`route()` constructs the tenant-scoped store BEFORE the asset fall-through at the
end, so `UnknownTenantError` becomes a 503 on `/builder/*` and `/webui/*` — build
artifacts that have nothing to do with a tenant. Meanwhile `/` is answered before
the store is built and returns 200. So the document loads and every module in its
import graph dies.

`main.js` then compounds it: `const sites = await fetchSites()` is a TOP-LEVEL
await, so any API failure rejects the module and nothing mounts.

### Two changes

1. **The store is opened lazily.** Only routes that need it open it, so an asset
   request never constructs one. The fall-through stays LAST — moving it earlier
   would let an asset shadow a route, which is the property the ordering exists
   to protect.

2. **A boot guard in the chrome document.** If `#app` is still empty after the
   module graph has had its chance, it renders what actually went wrong —
   including the live status of `GET /api/sites`, so "no tenant" reads as itself
   rather than as a blank screen. Inline, because an external guard would be the
   very asset that may have 404ed.

### Acceptance criteria

10. An asset request succeeds when the store holds no tenant — build artifacts do
    not depend on one.
11. A builder that cannot start says so IN THE PAGE, naming the cause, for a
    missing tenant and for a missing asset alike.



## Follow-up: `bin/build` failed on a type-only reach into node

Found while getting the operator to a Cloudflare deploy: `bin/build` failed at
`apps/control-app`'s typecheck with five errors it had been emitting all along —

```
tools/generate/src/store/fsutil.ts(10,8):  Cannot find name 'node:fs'
tools/generate/src/store/fsutil.ts(11,18): Cannot find name 'node:path'
tools/generate/src/store/fsutil.ts(93,14): Parameter 'name' implicitly has an 'any' type
tools/generate/src/store/loadSite.ts(1,18): Cannot find name 'node:path'
tools/generate/src/store/paths.ts(1,18):   Cannot find name 'node:path'
```

`apps/control-app` is a Worker package: `types: ["@cloudflare/workers-types"]`,
no node types. Nothing in it should reach a node-only module.

### Cause

`render.ts` imported the TYPE `LoadedSite` from `../store/loadSite`, which only
RE-EXPORTS it while itself importing `node:path` and the filesystem helpers. The
type is declared in `assemble.ts`, which reaches nothing. One specifier.

### Why no test caught it

REQ-146's import guard walks RUNTIME imports and deliberately skips type-only
ones, because a bundler erases them — it is right about the bundle and silent
about this. But `tsc` does NOT erase a type-only import before resolving it, so a
type-only reach into a node-only module puts `node:fs` in a Worker's type
program. The bundle was always fine; the build was not, and the suite stayed
green while `bin/build` failed.

A UAT now walks type-only imports too, from the Worker entrypoints outward, and
fails on any that reach a node-only module. It was confirmed to fail against the
pre-fix specifier, naming the chain.

### Acceptance criterion

12. No module reachable from a Worker entrypoint imports a node-only module,
    including through a type-only import.

### Version bookkeeping

A fourth commit carries a version bump alone. `move-to-free-coded` refuses a
version already present at the tip of `xgd-working` on a commit not reachable
from the ticket's own SHAs — here the ticket auto-commits that landed on top of
the fix. The bump moves the claim onto a commit this ticket owns; no behaviour
changes. Ticket version is now 0.2.7.


## Follow-up: the deploy secret guard asked the wrong question

`bin/deploy.d/secrets/10-anthropic-api-key` refused any deploy run from a shell
without `ANTHROPIC_API_KEY`, including deploys whose secret had been in
Cloudflare since the previous run. The operator was asked to re-supply a value
the store already held, in order to overwrite it with itself. In practice this
made `bin/deploy` unusable from a fresh shell and pushed the operator toward
calling `wrangler deploy` directly, which skips the migrate hook as well — the
guard's own failure mode, arrived at by a different route.

### Cause

The guard's rule is "never deploy a control app that cannot take a turn". That
is a statement about the **store**, not about the operator's shell, and the hook
tested the shell. `: "${ANTHROPIC_API_KEY:?...}"` cannot distinguish "this
credential does not exist" from "this credential exists and is not in front of
me right now".

### The decision table

| The value is | The Worker | Outcome |
|---|---|---|
| in the environment | either way | **push** — supplying a value is how a rotation is expressed |
| absent | already holds the name | **keep** — reported, nothing overwritten |
| absent | does not hold it | **fail** before anything is uploaded |
| absent | could not be read at all | **fail**, naming the unread store |

Only a *positive* read satisfies the guard: the store answered, and the name was
in the answer. A `secret list` that fails for any reason — no such Worker on a
first deploy, no network, a token without Workers Scripts read — counts as
absent, because the failure mode being guarded against is a confident skip based
on an answer nobody actually got. The names are the only half of a secret that
is safe to read, and reading them mutates nothing, so the probe runs unchanged
on a rehearsal.

The probe is not called at all when the environment has the value, so the common
path adds no network round-trip and no new token permission. CI is untouched:
`.github/workflows/deploy.yml` calls `wrangler deploy` directly and never runs
these hooks.

`--dry-run` now reaches the same decision by the same route, *including the
failure*. A rehearsal that passed while the real deploy would abort was not a
rehearsal.

### Acceptance criteria

13. A deploy from a shell with no `ANTHROPIC_API_KEY` succeeds when the Worker
    already holds the secret, reports that it left it alone, and does not
    overwrite it.
14. A deploy from a shell that supplies a value pushes it, even when the name is
    already stored — rotation stays possible.
15. A deploy still fails, before any upload, when the value is in neither place,
    or when the store could not be read to check.
16. `--dry-run` reports the decision it would have acted on and fails where the
    real deploy would fail.

### Test changes

`tests/test_UAT_FC_REQ-149_deploy_secret_hook.test.ts` drives the hook as a
subprocess with a stubbed `npx` first on `PATH`. That stub is what makes the
branch this ticket fixes testable at all: the absent-locally / present-remotely
case cannot be reached by a test that holds a real credential, and must not
require one. Seven UATs cover the four outcomes, both rehearsal outcomes plus the
rehearsed failure, the standing "never print the value" rule, and `public-site`
exiting before it looks at the store — a model credential must never be pushed
to the Worker that serves rendered bytes.

Confirmed end to end against the real store: `bin/deploy --dry-run control-app`
with `ANTHROPIC_API_KEY` unset now reports
`ANTHROPIC_API_KEY already on 1stcontact-control-app — would leave it`.

### Version bookkeeping

The fix, its UATs and the `bin/deploy.d/secrets/README.md` contract update are
one commit, which bumped to 0.2.8. A second commit carries a further bump alone.

`move-to-free-coded` refuses a version present at the tip of `xgd-working` on a
commit not reachable from the ticket's own SHAs, and the ticket auto-commit for
this very section landed on top of the fix — so the tip held 0.2.8 without
belonging to the ticket. This is the same bookkeeping the previous increment
hit, and the same remedy: the bump moves the claim onto a commit this ticket
owns. No behaviour changes. Ticket version is now 0.2.9.