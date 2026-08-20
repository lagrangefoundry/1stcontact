---
uid: comment-98e86f10
id: COMMENT-1144
type: comment
title: Comment on request REQ-149
created_by: xgd
created_at: '2026-08-18T01:34:34.192504+00:00'
updated_at: '2026-08-20T00:05:28.752830+00:00'
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

<!-- xgd-chat-end -->