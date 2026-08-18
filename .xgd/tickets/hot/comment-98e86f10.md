---
uid: comment-98e86f10
id: COMMENT-1144
type: comment
title: Comment on request REQ-149
created_by: xgd
created_at: '2026-08-18T01:34:34.192504+00:00'
updated_at: '2026-08-18T01:38:06.795700+00:00'
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

<!-- xgd-chat-end -->