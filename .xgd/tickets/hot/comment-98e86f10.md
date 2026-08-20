---
uid: comment-98e86f10
id: COMMENT-1144
type: comment
title: Comment on request REQ-149
created_by: xgd
created_at: '2026-08-18T01:34:34.192504+00:00'
updated_at: '2026-08-20T23:37:20.819210+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-554ac441
  kind: chat_transcript
---

<!-- xgd-turn id="bd7d3832-0d62-4133-8fd0-b09d47f44049-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T01:34:29.564998+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="bd7d3832-0d62-4133-8fd0-b09d47f44049-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-18T01:38:06.642349+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Let me do the legwork before asking anything — the ticket poses four design questions, and most of them should be answerable from the code.

Now the Worker side — the routes REQ-145 ported, and how `public-site` reads.

I've read the full store chain (`site-store.ts`, `fs-store`, `d1r2-store`, `memory-store`), `cmdPublish`/`cmdCheckout`, the deploy pipeline (`deploy.ts`, `manifest.ts`, `content.ts`), `public-site/site-store.ts`, the D1 migration, and the REQ-145 router. The ticket's four questions are mostly answerable from what's there — here are my recommendations, and the five things I'd like you to confirm or redirect before I cut the branch.

## What I found

- `SiteStore` has **no** revision surface, and both non-fs adapters document that deliberately: memory and D1/R2 both report `pendingChanges` as "everything added, `baseRevision: null`", with a comment naming this ticket.
- `1c deploy` already writes the exact artifact publish needs — `sites/<slug>/rev/NNNN/{out,source}/` plus a `manifest.json` carrying `live`/`revisions[]`/`previews[]` — and `public-site` resolves published URLs *only* through that manifest.
- `snapshotSha`/`collectSnapshotFiles` are `node:fs` + `node:crypto`; the content-addressing idea ports, the code doesn't.
- `renderSite` is already split from `renderSiteFiles` precisely so the Worker path has no filesystem — but `renderSiteFiles` emits **text files only**; assets are copied separately from `loaded.sourceDir`, which a Worker doesn't have.

## My recommendations (ticket questions 1–4)

**Q1 — where revisions live:** D1 `site_revisions` rows for the metadata (`RevisionEntry` + `sha`), R2 for the snapshot bytes at deploy's existing layout, and the **manifest written on publish as a derived serving index** — not a second source of truth. Manifest-only can't hold `basedOn`/`by`/`changes` without growing into a history file, and the migration comment already earmarks a `revisions` table.

**Q2 — port vs service:** a **separate `RevisionStore` port + a `publish()` service** above both ports. Keeps `SiteStore` about drafts (memory store stays honestly revision-free), and mirrors REQ-142/143 exactly: one algorithm, two adapters (fs over `revisions/`+`history.json`, D1/R2 over rows+bucket).

**Q3 — snapshot without a directory:** a snapshot is the definition *set* (`site.json`, pages, asset bytes), and the diff compares two sets keyed by the same strings the tree used (`site.json`, `pages/home.json`, `assets/logo.svg`), hashing asset bytes. `ChangeSet` output stays byte-identical to today's, so `1c revisions` doesn't change shape.

**Q4 — publish vs deploy:** keep them separate **commands**, one publish **implementation**. `deploy` is a *transport* between two stores (and owns `--dry-run`/`--prune`/`--sandbox`/preview snapshots); publish never moves bytes between stores. In the Worker there is no transport — the revision store *is* R2 — so `/api/publish` mints + renders + writes and no deploy exists there.

## Questions

1. **Is "one implementation, two adapters" the right reading of AC-7?** I read "the local path is not left behind as a second code path" as *one publish algorithm, fs and D1/R2 adapters underneath* — the REQ-142 pattern — with `1c publish` still publishing locally. The alternative reading is **cloud-only publish**: delete the file-backed revision store and make `1c publish` a thin client of `/api/publish`. That's a much bigger deletion and would strand `1c deploy --channel published`. Confirm the first?

2. **AC-3 changes local `1c publish` semantics.** Today it mints a new revision every time, even with an empty change set. Content-addressed no-op means republishing an unedited draft returns the *existing* revision instead. That follows from AC-3 + AC-6, but it's a visible CLI behaviour change — OK?

3. **The published R2 keyspace is untenanted** (`sites/<slug>/…`), while draft assets are `draft/<tenantId>/<slug>/…`. A slug is a public address so it's inherently global, but that means tenant A could publish over tenant B's slug. Moot today (one tenant per deployment). Record it as a stated invariant plus a note, or do you want a slug-ownership claim table in *this* ticket?

4. **Behavior modules can't publish from the Worker.** REQ-148 confines the Worker render to L1 — no Astro container — so a site mounting a behavior module will fail publish by name. I'd treat that as the standing REQ-148 boundary and make the failure explicit rather than in scope here. Agree?

5. **Is checkout in scope for the Worker?** AC-4 requires history readable and checkout forward-only. Checkout has to move into the service anyway for the fs path, but there's no `/api/checkout` route today. I'd add the service verb + a `GET /api/revisions` read route, and leave a Worker checkout route out unless you want it — say if you want it in.

Once you answer these I'll write the ticket body up, cut `free-REQ-149`, and implement.

<!-- xgd-turn id="837ae2c8-ef06-410c-8e5b-df1316620de3-user" -->

<!-- xgd-chat role="user" ts="2026-08-19T23:48:49.267387+00:00" -->
#### You
Have you read the design docs - I think your questions are mostly answered there - can you check and come back with gaps please?

<!-- xgd-turn id="837ae2c8-ef06-410c-8e5b-df1316620de3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-19T23:54:01.117904+00:00" -->
#### Claude
I re-read the docs (DOC-12 in full, plus DOC-10 §4.1, DOC-28, DOC-8, DOC-5/DOC-1 policy) and the code seams. You were right — four of my five questions are answered. Here's what's settled, then the genuine gaps.

## Answered by the docs

**Q1 — one implementation, two adapters.** DOC-12 §7: *"The Worker reaches storage through a single `SiteStore` accessor; phase 2 swaps only its implementation"*, and *"everything but the store itself survives phase 2 unchanged"*. Phase 1 explicitly keeps `1c` as the renderer with local canonical definitions. So AC-7 is the REQ-142 pattern, not cloud-only publish. Withdrawn.

**Q1′ — where revisions live.** DOC-12 §7's phase-2 row is explicit: bytes at R2 `<root>/<slug>/rev/NNNN/{out,source}/`, metadata as D1 revision rows (`history.json` → `revisions` table). The migration header agrees (*"Revision snapshots likewise stay in R2"*). And DOC-12 requires `source/` to ship beside `out/` so a revision is a **complete** snapshot — that constraint survives phase 2, since D1 holds only the mutable draft.

**Q3 (ticket's) — snapshot without a directory.** DOC-12 §4 already defines `changes` over store-shaped path strings (`site.json`, `pages/home.json`, `assets/logo.svg`) — exactly the store's key space. No new computation to invent.

**Q4 (mine) — behavior modules.** Not a doc question: REQ-148 is in flight and *deletes* Astro from the render path rather than precompiling, so `contact-form` renders in workerd. REQ-149 just takes a dependency on it. Withdrawn.

**Q5 — checkout in the Worker.** DOC-28 §10's toolbar is site selector · View/Edit · open-in-new-tab · Publish. No checkout, no rollback; revision-diff is listed only as a possible future panel mode. So: service verb + a history read route, no Worker checkout route.

**Publish vs deploy (ticket Q4).** DOC-12 splits *storing* from *serving* and they move independently; deploy is transport, publish is minting. They stay two commands.

## Gaps — these need your call

1. **AC-3 contradicts DOC-12 §5.** DOC-12 makes content-addressing explicitly a *preview* property (*"a preview snapshot... deliberately not a revision"*) and `publish` mints unconditionally. A no-op republish returning the existing revision is a real change to the documented model. Keep AC-3? (I'd say yes — then DOC-12 §5 needs a line.)

2. **Tenancy of the published keyspace.** DOC-10 §4.1 and the migration make the tenant the hard barrier and say two accounts may each own `home`. But DOC-12 §7's R2 keys and public-site's URLs are slug-only, untenanted — so two tenants' `home` collide in both. DOC-12 §9 defers the URL scheme entirely. Options: state a global-uniqueness invariant for published slugs now (cheap, one deployment per tenant today), or put the tenant in the published key (breaks public-site's URL grammar and DOC-12 §7). Recommend the former plus a note.

3. **`basedOn` has nowhere to live in D1.** The fs store has `writeDraftBase`; the `sites` table has no base-revision column and there is no `site_revisions` table. This ticket needs migration `0002` (revisions table + a base column). Confirm that's in scope.

4. **`/preview/<slug>/published` currently 501s naming REQ-149.** No doc says whether the builder serves published itself or hands off — DOC-12 says public-site serves published. Recommend a 302 to the public-site URL so there stays exactly one serving path. Confirm.

5. **Manifest vs D1 as the revision record.** DOC-12 phase 2 says D1; public-site's seam comment says phase 2 *replaces its implementation* to read D1; but AC-2 says public-site is unchanged. Both hold only if D1 is the authority and `manifest.json` is written on publish as a derived serving index — two records of `live`. The alternative is manifest-only (no D1 revisions table), which is simpler but grows the manifest into `history.json`, which DOC-12 §5.1 deliberately kept it from becoming. I lean D1-authoritative + derived manifest; say if you'd rather stay manifest-only for now.

Minor, non-blocking: **DOC-8 is stale.** DOC-28 cites DOC-8 §3.2 (multi-mode display panel), §4.1 (three render channels) and §13 Q3 — none of which exist in the stored DOC-8, which still commits to in-browser rendering that DOC-12 §11 withdrew. Worth a rewrite at some point; it doesn't block this ticket.

Also in scope by implication, flagging so it isn't a surprise: R2 has no server-side copy, so writing a complete revision snapshot means a get+put per asset per publish (DOC-12 §8 accepts full snapshots for MVP), and `/api/sites` should stop reporting `latest: null` once revisions exist.

Answer 1–5 and I'll write the ticket body, cut `free-REQ-149`, and implement.

<!-- xgd-turn id="7893d046-9a8c-46dc-b55d-4c53467ca98b-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T00:05:28.604838+00:00" -->
#### You
Can you explain all of these in more detail I'm afraid I'm not following

<!-- xgd-turn id="7893d046-9a8c-46dc-b55d-4c53467ca98b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T00:07:42.556661+00:00" -->
#### Claude
Sure. Let me back up and set the scene first, because the five questions only make sense against what publish actually does.

## The orientation

Today `1c publish` (`tools/generate/src/cli/commands.ts:154`) does seven things on the local filesystem:

1. validates the draft (`loadOrThrow`) — if it fails, nothing is written;
2. reads `history.json` to find the current live revision;
3. mints the next id (highest + 1);
4. copies `draft/` to `revisions/0002/` — a directory copy;
5. diffs the old revision directory against the new one to produce `changes`;
6. appends an entry to `history.json`;
7. re-parents the draft (`base.json` now says "I descend from 0002") and renders the result to `storage/dist/<slug>/published/`.

Separately, `1c deploy` uploads rendered bytes to R2 at `sites/<slug>/rev/0002/out/` and rewrites `sites/<slug>/manifest.json`, which is what `public-site` reads to serve `https://1stcontact.io/site/<slug>/`.

REQ-149 has to make steps 2–7 happen inside a Worker, where there are no directories — only D1 rows and R2 objects. Steps 4, 5, 6 and 7 have no equivalent there today. Every question below is a consequence of that.

---

## Gap 1 — should publishing an unchanged draft be a no-op?

**Today:** publish always mints. Run it twice with no edits and you get revision 0002, byte-identical to 0001, with an empty `changes` list. DOC-12 §5 says this in as many words: *"Publish always renders."* Content-addressing — same bytes, same id, genuine no-op — is something DOC-12 §5.1 attaches deliberately to *preview snapshots*, and it takes care to say a preview *"is deliberately not a revision."*

**Why it's now a question:** on the CLI you type `1c publish` on purpose. In the builder it becomes a toolbar button (DOC-28 §10), and people double-click buttons, and press them again when they aren't sure it worked. Under today's rule that behaviour silently fills history with identical revisions.

AC-3 on your ticket asks for the opposite: publishing twice with no intervening edit returns the same revision. The check is nearly free — publish already computes the diff for `changes`, so the rule is just *"if the diff against live is empty, return live and mint nothing."*

Two things worth knowing before you choose:

- It changes what `-m "message"` means. Re-publishing an unchanged draft with a new message would do nothing at all, message included. (The alternative — mint a revision whose only change is its message — is worse.)
- It does **not** weaken forward-only. Check out revision 3 while 5 is live and the draft now differs from live, so the diff is non-empty and publish mints 6. Rollback still works exactly as DOC-12 §5 describes.

**My recommendation:** adopt AC-3, and have the builder say "no changes to publish" rather than silently doing nothing. DOC-12 §5 then needs one sentence added, because as written it says the opposite.

---

## Gap 2 — the published keyspace has no tenant in it

This one is the most consequential, so bear with the detail.

**Two halves of a site's life, two addressing schemes.** REQ-143 made the *draft* side tenanted, and did it thoroughly — the migration header is emphatic: *"TENANCY IS A COLUMN, NOT A NAMING CONVENTION."* Every D1 row is keyed `(tenant_id, slug)`, draft asset bytes live at `draft/<tenant>/<slug>/assets/…`, and the comment states the intent plainly: two accounts may each own a site called `home` without colliding.

The *published* side, which predates all of that (REQ-110/111), has no tenant anywhere:

```
sites/<slug>/manifest.json          ← the index of what is live
sites/<slug>/rev/0002/out/…         ← the bytes
https://1stcontact.io/site/<slug>/  ← the public URL
```

**Why publish is where this bites.** Until now the writer of those keys was `1c deploy` running on your laptop, against your own definitions. REQ-149 makes the writer a multi-tenant Worker holding a D1 database in which slugs are only unique *within* a tenant. So: tenant A publishes `home` → `sites/home/…`. Tenant B publishes their `home` → the same keys. B's publish overwrites A's live site, and `public-site` serves it, because nothing in that path ever knew a tenant existed.

Nothing breaks today — `TENANT_ID = "1stcontact"` is hardcoded in `wrangler.toml` and there is exactly one tenant. But this is the ticket that makes the collision *reachable*, and it's cheaper to close now than after there are published sites to migrate.

**Option A — declare published slugs globally unique.** A slug is claimed platform-wide by whoever publishes it first. Public URLs stay `/site/<slug>/`, DOC-12 §7's layout is untouched, `public-site` needs no change at all. To make it real rather than aspirational, publish records the owning tenant in the manifest and refuses to write a manifest owned by somebody else. That's one additive field that `public-site`'s reader ignores, and roughly ten lines in the publish path.

**Option B — put the tenant in the key** (`sites/<tenant>/<slug>/…`). Safe by construction, no claim rule needed. But it changes DOC-12 §7's documented layout, `public-site`'s `manifestKey()`, and the public URL grammar — or, if you want to keep `/site/<slug>/` public, it forces a slug→tenant lookup in D1 on every public request, which is a database read on the hot serving path that the manifest design specifically avoids.

**My recommendation:** A. It keeps the public serving path exactly as DOC-12 §7 documents it, and the guard makes the collision impossible rather than merely unlikely. The genuine long-term answer is per-tenant hostnames — subdomains and custom domains — which DOC-12 §9 already lists as deferred and additive.

---

## Gap 3 — the draft's lineage pointer has nowhere to live in D1

**What lineage is.** On disk each draft carries a small `base.json` saying which revision it descends from (`readDraftBase` / `writeDraftBase`). It does two jobs:

- it becomes `basedOn` in the history entry, which is how you can tell "revision 6 came from checking out 3 and republishing" apart from "revision 6 is an ordinary edit on top of 5" (DOC-12 §4: *"`basedOn` is recorded when the draft was `checkout`'d from a non-latest revision"*);
- it's the baseline for checkout's dirty check — "you have uncommitted changes, publish them or pass `--force`."

**The problem.** The `sites` table has exactly these columns: `tenant_id`, `slug`, `site_json`, `version`, `counter`, `created_at`, `updated_at`. No lineage column. And there is no revisions table at all — the migration says explicitly *"Revision snapshots likewise stay in R2."*

So a Worker doing step 6 and step 7 of publish has nowhere to write either the revision record or the re-parented base pointer. This isn't a design choice so much as a missing piece: REQ-149 needs a `db/migrations/0002_*.sql` adding a `site_revisions` table (tenant, slug, id, published_at, published_by, message, based_on, changes, sha) and a base-revision column on `sites`.

I'm flagging it because a schema migration is a bigger thing than "port a function", and because it's the one part of this that gap 5 could delete entirely. **What I need is just confirmation that a migration is in scope for this ticket.**

---

## Gap 4 — what should `/preview/<slug>/published` do?

**Where this comes from:** the builder's preview route (`apps/control-app/src/router.ts:492`) serves `draft` and `edit` by rendering on request from the store. It refuses `published` with a 501 naming your ticket, and the comment explains why: *"`published` is not here: it is the immutable artifact a publish produced, it lives in R2, and `public-site` serves it. Re-deriving it from today's draft would make the published channel show unpublished work."*

Once publish exists, that route has to answer something. Two ways:

- **Redirect** (302 to `https://1stcontact.io/site/<slug>/`). One serving path for published bytes, exactly as DOC-12 §7 assigns it. The cost: the iframe leaves the Access-gated origin, so a site that has never been published shows `public-site`'s 404 rather than a builder-shaped message.
- **Proxy** — control-app reads the manifest and streams the bytes itself. Everything stays same-origin and behind Access, but it duplicates `public-site`'s resolve-and-serve logic, which is precisely what that seam exists to own, and creates a second reader of the manifest with its own caching rules to keep in step.

Worth noting DOC-28 §10's toolbar has no "published" mode at all — it's site selector, View/Edit toggle, open-in-new-tab, Publish. So this route is reachable mainly by hand-typed URL, which argues for the cheap answer.

**My recommendation:** redirect.

---

## Gap 5 — is D1 or the manifest the record of revisions?

This is the one where three documents genuinely disagree, so let me lay them side by side.

- **DOC-12 §7**, phase 2 column: history log → *"D1 `revisions` table"*.
- **`apps/public-site/src/site-store.ts`**, the seam comment: *"Phase 2 answers from D1 (`sites` / `revisions` / `pages`) by replacing the implementation and nothing else."*
- **Your AC-2**: `public-site` serves the resulting revision through its existing seam, **unchanged**.

All three can hold only if publish writes *both*: D1 rows as the builder's authority, and `manifest.json` as a derived serving index that `public-site` keeps reading exactly as it does now. The D1 swap on the reading side then becomes a later ticket, which is what the seam was built for.

**The cost of that is duplication of `live`**, recorded in two places with no transaction spanning D1 and R2. If the D1 write lands and the manifest write doesn't, the builder believes revision 5 is live while the world still serves 4. That's containable by ordering the writes — bytes first, then D1, then the manifest flip last — so a mid-failure leaves an orphaned snapshot nobody can see, rather than a manifest pointing at bytes that don't exist. But it's real, and it's worth choosing knowingly.

**The alternative — manifest-only.** No `revisions` table, no migration (gap 3 mostly evaporates), one source of truth, no skew. Publish becomes: write bytes, rewrite manifest. The price is that `basedOn`, author and the per-path `changes` list all move into the manifest, growing it into the `history.json` that DOC-12 §5.1 deliberately kept it from becoming; every "show me the history" becomes an R2 GET of an unbounded file; and the builder's history UI ends up reading R2, which is the opposite of the direction DOC-12 §7 and that seam comment both point.

**My recommendation:** D1-authoritative with a derived manifest, manifest written last. But manifest-only is a defensible smaller step for a single-tenant MVP, and if you'd rather take it I'll do that and leave the revisions table to the ticket that moves `public-site` onto D1.

---

## The three minor ones

**`/api/sites` reports `latest: null` for every site** (`router.ts:327`), with a comment saying so is honest because no revisions exist yet. Once they do, it should report the live revision. Small, but it's in this ticket's scope by definition.

**Copying asset bytes into a revision is get-then-put.** DOC-12 §8 chooses full snapshots for the MVP — a revision copies the whole working set — and DOC-12 §7 requires `source/` to ship beside `out/` so a revision is complete on its own. The Workers R2 binding has no server-side copy, so each asset is read into the isolate and written back out on every publish. Fine for the sites we have; it's the one place publish could get slow on an image-heavy site, and worth knowing before it surprises us.

**DOC-8 is stale.** DOC-28 cites DOC-8 §3.2 (the multi-mode display panel), §4.1 (three render channels) and §13 — none of which exist in the stored DOC-8, which still commits to in-browser rendering that DOC-12 §11 withdrew. Doesn't block this ticket; worth a rewrite sometime.

---

## What I need from you

| # | Question | My default if you just say "go" |
|---|---|---|
| 1 | Unchanged draft: no-op, or always mint? | No-op (AC-3); add a line to DOC-12 §5 |
| 2 | Tenant in the published keyspace? | No — globally unique published slugs, enforced by an owner field in the manifest |
| 3 | Migration `0002` in scope? | Yes (unless you pick manifest-only in Q5) |
| 4 | `/preview/<slug>/published` | 302 to `public-site` |
| 5 | Revision record | D1 authoritative, manifest derived and written last |

Say "go with your defaults" and I'll write the ticket body, cut `free-REQ-149` and build it — or overrule any of them and I'll work to that instead.

<!-- xgd-turn id="739a7a6f-f689-493f-a914-139541059ae7-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T00:53:43.964342+00:00" -->
#### You
## Gap 1 — should publishing an unchanged draft be a no-op? - yes
Gap 2 — the published keyspace has no tenant in it
Option A 

Gap 3 — the draft's lineage pointer has nowhere to live in D1 - yes make it happen

Gap 4 — what should `/preview/<slug>/published` do? redirect

Gap 5 — is D1 or the manifest the record of revisions?D1-authoritative - but do we really need a manifest? I have a strong alergic reaction to duplicated data. If we can figure out a way to have one canonical source of truth this would be stronger IMO

<!-- xgd-turn id="739a7a6f-f689-493f-a914-139541059ae7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T00:56:40.774688+00:00" -->
#### Claude
Good — 1 through 4 locked. On 5, your instinct is right and I think we can actually get there; let me check what deleting the manifest would cost before I commit to it.

Yes — we can get to one canonical record, and it's a better design than what I proposed. Let me lay out what it costs, because the cost is mostly *deletions*, which is the good kind.

## Why I hedged, and why the hedge doesn't survive scrutiny

I kept the manifest because `public-site` reads it. But `public-site` caches every 200 in the edge Cache API (`apps/public-site/src/index.ts:52`), so the store is touched only on a cold miss — the manifest was never a hot-path optimisation, it was just where the truth happened to live. And its own seam comment already promises the swap: *"Phase 2 answers from D1 (`sites` / `revisions` / `pages`) by replacing the implementation and nothing else."* Your AC-2 said "through its existing seam, unchanged" — the seam is the interface, and it stays unchanged. I read it too literally.

So: **D1 is the only record. R2 holds bytes and nothing authoritative.**

## What the manifest is actually doing, and where each job goes

It's carrying four jobs, which is why deleting it touches more than one thing:

| Job | Moves to |
|---|---|
| which revision is live | derived — `MAX(id)` over the revisions table |
| vouching for a URL-supplied preview sha before it becomes an R2 key | a row lookup, same guarantee |
| GC roots for `1c deploy --prune` | D1 rows |
| deploy's "already deployed" check | publish's own no-op check (Gap 1) |

Note the first one: **`live` must not be a stored column.** DOC-12 §4 is explicit — *"No `head` field (live = highest id)"* — and §10 already made REQ-7 drop `published_revision_id` for exactly this reason. Storing it would be reintroducing the duplication the model rejected once. It's one join, and it's cached at the edge anyway.

## The schema that falls out (migration `0002`)

```sql
-- Gap 3: the draft's lineage pointer.
ALTER TABLE sites ADD COLUMN base_revision INTEGER;

-- The revision record. Immutable once written; live = MAX(id).
CREATE TABLE site_revisions (
  tenant_id, slug, id INTEGER,
  published_at, published_by, message,
  based_on INTEGER,        -- DOC-12 §4: set when the draft was checked out from a non-latest revision
  changes TEXT,            -- the per-path diff, as DOC-12 §4 defines it
  sha TEXT,                -- audit, not addressing
  PRIMARY KEY (tenant_id, slug, id)
);

-- Gap 2's slug claim AND public-site's slug → tenant resolution, one table.
CREATE TABLE published_sites (
  slug TEXT PRIMARY KEY,   -- the PK *is* the global-uniqueness guarantee
  tenant_id TEXT NOT NULL,
  first_published_at TEXT NOT NULL
);
```

That last table is the part I like: gap 2 asked for a slug claim, and `public-site` needs slug → tenant to find the rows. One table does both, and the primary key makes tenant B's collision a constraint violation at publish time rather than a check someone has to remember to write.

`public-site` then resolves with a single query joining those two, builds the prefix from the row's own values, and serves `sites/<slug>/rev/NNNN/out/`. The key security property is preserved verbatim — no URL component reaches an R2 key unless the store vouched for it; it's just a row vouching instead of a JSON object.

The R2 layout in DOC-12 §7 doesn't change at all, except that the `manifest.json` row disappears. And `source/` stays beside `out/`: D1 holds only the *mutable* draft, so R2's `source/` is the only copy of what the definition looked like at revision N — that's what makes checkout possible, and it isn't duplication because nothing else holds that fact.

## The consequence you should look at hardest

**A single canonical record in D1 means the CLI can no longer be a publisher.** `1c deploy` runs in Node with no D1 binding — the same wall that made `bin/publish` POST to `/api/import` rather than write the database (`router.ts:268`: *"THE WORKER IS THE WRITER, deliberately"*). The alternative is shelling `wrangler d1 execute` with hand-escaped SQL, which that comment already rejected.

So `1c deploy --channel published` doesn't get ported — it gets **deleted**. Its whole job (ship a revision's bytes, record it live) is what publish now does inside the Worker with both bindings in hand. This is your ticket's own Q4 answered in the strongest form, and AC-7 in its literal sense: one publish implementation, no local second path.

`1c publish` against the *filesystem* store survives untouched, for local dev and the reproduction pipeline. That isn't duplication — a given site lives in exactly one store, and each store keeps its own record (`history.json` on disk, rows in the cloud). One algorithm above the port; the port grows revision-*storage* verbs, not a `publish()` verb.

## The one thing I need you to decide

Deleting `1c deploy` takes draft **preview snapshots** with it — the sha-addressed shareable draft links at `/site/<slug>/draft/<sha>/` (DOC-12 §5.1), the "send the client a link to review before it goes live" feature. They're manifest-backed too, so they can't stay behind while revisions move; a half-manifest would be exactly the legacy-mode split `CLAUDE.md` forbids.

- **Port them in this ticket** — a `POST /api/preview` route: the Worker already renders draft, so it's render → hash → put bytes → insert a `site_previews` row, and a CLI command that calls it. Maybe a day, reusing machinery publish needs anyway. Keeps a working feature working.
- **Drop them, reinstate later** as a "Share draft" button in the builder toolbar. Smaller now; the feature is gone in the meantime. Note the builder's own draft preview is unaffected either way — that's `/preview/<slug>/draft/` behind Access, already live from REQ-145.

Two things I'd defer explicitly rather than pretend away: **`--prune` has no home** once deploy dies (orphaned bytes from an interrupted publish are unreachable and cost only storage — a Worker maintenance route later), and the R2 `sandbox/` root becomes dead weight, since only the Worker writes R2 and it only ever writes its own tenant's real sites.

Also worth saying plainly: this is more than "port publish". It's migration `0002`, revision storage in the port, the publish service, render-to-R2, `public-site`'s store swap, and deleting deploy. Still one coherent unit — splitting it would leave a half-migrated manifest between tickets — but it's a fat 13.

Tell me previews (port or drop) and I'll write the ticket body, cut `free-REQ-149`, and start.

<!-- xgd-turn id="cb161374-c2a2-4bb0-be7c-ba25ffb047df-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T21:27:58.728272+00:00" -->
#### You
**A single canonical record in D1 means the CLI can no longer be a publisher. <-- we could maybe modify the CLI so it hits an endpoint, right? But I have no hard requiirement to maintain the CLI it is for dev and test only**

<!-- xgd-turn id="cb161374-c2a2-4bb0-be7c-ba25ffb047df-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T21:32:51.807219+00:00" -->
#### Claude
I'll check what actually depends on the local publish path before answering — that determines whether "CLI as a client" is a small change or a large deletion.

Answer to your question, then what it changes.

## Yes — but you don't need HTTP, because the endpoint already runs inside the CLI

`tools/generate/src/cli/builder.ts` isn't a second server; its own header says it's a **transport** — `node:http` in, `Request`/`Response` out, straight into `apps/control-app/src/router.ts`'s `route()`. One route table, two front doors.

And publish is already sitting on that seam, half-built:

- the builder UI already POSTs `/api/publish` (`builder/api.js:228`)
- the shared router already has the path, 501-ing and naming your ticket (`router.ts:257`)
- the Node transport **intercepts `/api/publish` before delegating** and calls `cmdPublish` on the filesystem (`builder.ts:366`)

That interception is precisely the second code path AC-7 is about. So the deliverable is: put publish in the shared route table, delete the interception. Then `1c publish` doesn't need to become an HTTP client at all — it calls the same `publish()` service the route calls, handing it the fs-backed store. Same singleness, no running server required, and the 26 test files that call `cmdPublish` keep working untouched.

## What "dev and test only" actually buys

I checked what the local publish path holds up: 26 test files call `cmdPublish` (mostly as setup, so there's a published channel to render/serve/deploy from), `published` is the *default* source for `1c serve` and several repro commands, and the whole capture/render/diff/gate pipeline is CLI-only with no cloud equivalent. So deleting it isn't cheap.

More importantly it wouldn't reduce duplication. `history.json` and the D1 rows are records of **different sites in different stores** — never the same fact stored twice. The thing you reacted to was `manifest.json` vs D1 describing *one* site, and that's the one being deleted. Two adapters behind one port is the REQ-142/143 pattern already in place for drafts; the algorithm stays a single function.

Where your remark does pay: it removes the last hesitation about deleting `1c deploy --channel published` **and preview snapshots**. Both are CLI-delivered and manifest-backed. If the CLI isn't a product surface, dropping them costs nothing that matters, and the real feature — "Share draft" — comes back properly as a builder toolbar button later. **So: previews dropped.** That closes the last open question.

Let me write this up.

Ticket body written (title and origin preserved; the four open questions are now seven recorded decisions D1–D7, with the schema, scope, revised ACs and deferrals).

**The design, in one line each:**

| | |
|---|---|
| D1 | Unchanged draft → no-op, returns the live revision |
| D2 | Published slugs globally unique, claimed on first publish (`published_sites` table) |
| D3 | Migration `0002`: `site_revisions`, `published_sites`, `sites.base_revision` |
| D4 | `/preview/<slug>/published` → 302 to `public-site` |
| D5 | **D1 is the only record. `manifest.json` deleted. `live` derived, never stored** |
| D6 | One `publish()` service over the port; route handler and `1c publish` both call it; **`1c deploy` deleted** |
| D7 | Draft preview snapshots dropped; return later as a builder "Share draft" button |

Two things worth your eye before I start, because both are deletions of working behaviour:

- **`1c deploy` goes.** After this the only path from a local site to the cloud is `bin/publish` (import into D1) then publish. That's already how drafts get there, so it isn't a new step — but it does mean no laptop can put bytes in R2 any more, by design.
- **Shareable draft links go with it** (`/site/<slug>/draft/<sha>/`). The builder's own Access-gated draft preview is unaffected.

Everything else is additive or internal. Story points still read 13 and that's honest — migration, port verbs, the service, render-to-store, `public-site`'s swap, and two deletions.

Say go and I'll set `status=free_coding`, cut `free-REQ-149`, and build it.

<!-- xgd-turn id="b2f5782a-866d-4611-b6ee-e761f80a4601-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T21:35:20.467315+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="b2f5782a-866d-4611-b6ee-e761f80a4601-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T22:05:22.706726+00:00" -->
#### Claude
Starting with the code I'll be changing. Let me read the store port and the publish path.

I have what I need — no blocking questions. Cutting the branch.

Working in the new worktree. Let me map the deploy-command surface I'm deleting.

Now implementing. Starting with the worker-safe revision model.

Now the publish service — one implementation over the port.

Now the filesystem adapter's revision verbs.

Now the D1/R2 adapter — the new half.

Now the module-level helpers the D1 adapter needs.

Now `commands.ts` — publish, checkout and revisions become thin wrappers over the service.

Now the router: the real `/api/publish`, the published-channel redirect, and live revisions in `/api/sites`.

Now the public-site rewrite — D1 as the only record, draft channel gone.

Now the AI toolbox and the builder client.

Baseline captured: 10 pre-existing failing files. Now the same run with my changes.

13 newly-failing files. Let me separate real breakage from tests of deleted features.

Two are real test-churn; one is a genuine finding — my 409 bypasses the router's scrubber. Fixing that properly.

Now the shared test fixture, so suites seed R2 through the same key builders the adapter writes with.

Now delete the suites that test removed features, and write the end-to-end workers UAT.

Now the end-to-end UAT in workerd — real D1, real R2, real publish, real serve.

<!-- xgd-turn id="34c0a5b1-cfcd-4de8-8705-28cf58817d5f-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T23:37:20.722466+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-chat-end -->