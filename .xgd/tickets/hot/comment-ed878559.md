---
uid: comment-ed878559
id: COMMENT-2284
type: comment
title: Comment on request REQ-190
created_by: xgd
created_at: '2026-09-05T22:15:59.310471+00:00'
updated_at: '2026-09-05T22:21:33.606978+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3a87d4a1
  kind: chat_transcript
---

<!-- xgd-turn id="b9a90ec6-8b09-4bb4-a82b-15271d5d72fb-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T22:15:34.132518+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="b9a90ec6-8b09-4bb4-a82b-15271d5d72fb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T22:21:33.570855+00:00" -->
#### Claude
I've read the schema, both stores, the identity/scope layer and the tests that pin them. Findings below — no changes made.

## 1. Two rows of the ticket's table are already fixed, and that changes the shape of the work

**`tenants.id` is already opaque for every business except one.** `provisionBusiness` mints `newId('acct')` (`apps/control-app/src/identity.ts:446`) and `createTenant` writes it. The only non-opaque tenant id in existence is `'1stcontact'`, seeded by `0005` and named by `TENANT_ID`. So the "propagates into every `tenant_id`, into R2 prefixes and `/b/<id>/` URLs" cost is real but confined to a single row — the platform business — and the R2 blast radius outside D1 is one tenant's objects, in a world where D1 is being wiped anyway.

**`published_sites`' global slug is already claimed, not silently overwritten.** `claimSlug` (`tools/generate/src/store/d1r2-store.ts:255-271`) does a conditional insert and re-reads the winner, throwing `SlugClaimedError` on loss. And `createStarterSite` (`identity.ts:494-510`) sets the starter slug **to the business id**, precisely to dodge the collision. So the live failure is not a cross-tenant overwrite or a disclosure of content — it is (a) an existence oracle: publishing `home` and getting refused tells you another business holds it, and (b) the first customer who renames their starter site to something plausible takes that name globally.

Worth correcting in the body — the current text says "the first two customers who choose the same slug collide", which reads as data loss and is not what the code does.

## 2. The hardest problem is not in SQLite: `/site/<slug>/` carries no tenant

`apps/public-site/src/routes.ts:1-23` fixes the public grammar as `/site/<slug>/…`, and `D1SiteStore.read` (`apps/public-site/src/site-store.ts:97-105`) resolves it by joining `published_sites` → `site_revisions` **through the slug alone**, because the request has no business in it. `0002_revisions.sql:56-69` says this explicitly and calls the global unique index "THE GUARANTEE".

So `two businesses can each publish a site called home` is not achievable by changing keys. It requires changing the public address:

- **(a) per-business hostname** — DOC-12 §9's stated answer, and by far the biggest piece of work (custom domains, cert provisioning, host→business resolution). Out of scope for a schema ticket.
- **(b) put the business in the path** — `/b/<businessId>/<slug>/` or `/s/<siteId>/`. Cheap, and consistent with the ticket's "the same key is safe in a URL". Costs: every published page references assets document-relatively (`routes.ts:29-36`), so the depth change is safe, but every published URL changes and the apex/marketing story needs a look.
- **(c) keep the global claim** and drop this AC, treating the starter-site-slug-is-the-business-id trick as the interim.

This needs your decision before anything else; it determines whether `published_sites` keeps a slug unique index at all.

Note also that the ticket's "the same key is used in joins and in URLs" does **not** hold for sites: the published address is deliberately a human-chosen slug. The key sits behind it. That's consistent with the rule but the phrasing conflates them.

## 3. The move AC and the erasure AC pull in opposite directions

The new section wants *"no R2 object copied"* on a move. The draft prefix is `draft/${tenantId}/${slug}/…` (`d1r2-store.ts:369, 423`). Any prefix containing the tenant means a move copies objects. So the prefix must become `draft/<siteId>/…`.

But the other AC says *"R2 prefixes and the erasure path follow the new keys"*, and DOC-37's erasure is implemented as *delete everything under `t/<tenant>/`*. Drop the tenant from the site prefix and a business's sites are no longer under one prefix.

Two useful facts: erasure is **not implemented** — `portal.ts` renders an explanation and `people.ts:367` mentions the obligation; nothing deletes. And the genuinely per-business prefixes (`t/<tenant>/blob/`, `t/<tenant>/ref/`, `kb/<tenant>/`) are unaffected, because blobs and knowledge belong to the business, not to a site.

So the resolution is available now and cheap: **erasure enumerates a business's site ids from D1 and deletes each site prefix, plus the three tenant prefixes.** Query-driven rather than one prefix sweep. Worth writing into the ticket, because otherwise the two ACs are unsatisfiable together.

## 4. "No integer sequence" needs a carve-out or it destroys two correct designs

Read literally, *every primary key becomes an opaque random id... No integer sequence* takes out:

- **`site_revisions.id`** — monotonic per site, forward-only, and its *ordinality is its meaning*: live is `MAX(id)` with no head pointer (`0002_revisions.sql:26-30`, DOC-12 §4), and it is published in R2 as `rev/0001` (`revision-model.ts:219-240`). Randomising it removes the ability to derive "live" at all.
- **`site_changes.at`** — not a timestamp despite the name; it is the journal counter, `row.counter + 1` (`d1r2-store.ts:623`), and the window is enforced by `DELETE … WHERE at <= ?`.

Both are *positions in a sequence*, not identity surrogates. The rule is about identity; these are ordering. Suggest the body says so, otherwise a later reader (or a reconcile pass) will treat them as violations.

Same question, smaller: `site_pages`/`site_assets` are keyed `(tenant_id, slug, name)` where `name` is `home.json` / `logo.svg` — data. But the name *is* the addressing token for the store's whole port (`readAsset(slug, name)`), and renaming a page is not something anyone has asked for. My read: these become `(site_id, name)` and stop there.

## 5. `TENANT_ID` becomes a magic constant shared by two files with nothing checking them

If `tenants.id` for the platform business becomes opaque, then `apps/control-app/wrangler.toml:118` and `:242` must carry a literal like `acct_9f3c…`, and the baseline SQL must seed *exactly that literal*. Nothing today would catch a mismatch — the symptom would be `UnknownTenantError` on every deployed request. This wants a UAT pinning the toml value against the baseline's seed, in the same spirit as the existing `migrations_dir` and Access-var guards.

Second-order: `ensurePlatformOperator` calls `createTenant({ id: platformTenant, name: platformTenant })` (`identity.ts:676`). With an opaque id, the break-glass path would name the business `acct_9f3c…`. Needs a `PLATFORM_NAME` or to rely on the baseline having seeded the row first.

## 6. The sweep is contained; the test surface is not

All the SQL against these tables lives in four files — `d1r2-store.ts` (22 statements against `tenant_id = ? AND slug = ?`), `apps/public-site/src/site-store.ts` (one join), `identity.ts`, `material.ts`. That's small.

What the rebaseline breaks:

| Thing | Where | Why |
|---|---|---|
| explicit migration list | `tests/support/d1-site-factory.ts:41-71` | eight entries, ordering-commented |
| raw migration imports | `test_UAT_FC_REQ-167_identity.workers.test.ts:19`, `test_UAT_FC_REQ-168_scope.workers.test.ts:20` | import `0004`/`0005` by filename |
| ticket-store transcription UAT | `test_UAT_FC_REQ-162_ticket_store_bindings.test.ts:39,109,121` | hardcodes `0003_ticket_store.sql`, asserts `^0003_`, and asserts `ALTER TABLE tenants ADD COLUMN config` is present — which in a single baseline is a duplicate-column error and must go |
| vocabulary guard | `test_UAT_FC_REQ-180_business_vocabulary.test.ts:242-268` | reads every migration and pins `tenant_id` as the column name, forbidding `ALTER TABLE tenants RENAME` |

That last one is a live constraint on naming: `memberships`/`entitlements` say `business_id` after REQ-184, `sites` and friends say `tenant_id` by REQ-180 §3's explicit decision. The baseline has to pick one and, if it unifies, amend that UAT with a stated reason.

Also note the ticket-store DDL is **not ours** — it is `@lagrangefoundry/ticketing`'s `SCHEMA_STATEMENTS`, transcribed, with a UAT asserting every statement appears verbatim. The baseline must keep those statements byte-identical; only the `tenants` reconciliation around them changes.

## 7. Three ACs name operations that do not exist

There is no rename of a business name, no rename of a site slug, and no move. `SiteStore` (`site-store.ts:164-250`) has no `rename`; nothing anywhere issues `UPDATE tenants SET name`.

That's fine and doesn't need them built — the ACs are *schema properties*, and a UAT can prove them directly: `UPDATE sites SET slug = ?`, then assert pages, assets, journal, revisions and the published resolution all still answer; `UPDATE sites SET business_id = ?`, then assert the site is fully readable from the new business's handle and unreachable from the old, with no other table touched and no R2 object rewritten. That is stronger evidence than a rename tool would be, and it keeps the move tool where the ticket wants it — later.

## 8. One structural consequence

`newId` lives in `apps/control-app/src/identity.ts`, and the dependency runs control-app → tools/generate, one way (11 control-app modules import `tools/generate`; nothing goes the other way). If the site store mints site ids, `newId` has to move down into `tools/generate/src/store/` with control-app re-exporting it. Small, but it touches the module the whole ticket's rule is anchored to.

---

## What I'd like decided before drafting the plan

1. **The published address.** (a) hostnames, (b) business in the path, or (c) keep the global slug claim and drop that AC. This is the only one that gates the schema.
2. **Erasure by enumeration** — confirm the draft prefix drops the tenant (`draft/<siteId>/…`) and erasure becomes a query-driven sweep, so the move AC is satisfiable.
3. **Carve-out for ordered sequences** — `site_revisions.id` and `site_changes.at` stay integers, stated in the body.
4. **Column naming** — `sites.tenant_id` vs `sites.business_id`, and whether REQ-180's vocabulary guard gets amended.
5. **Scope of the fs store.** `storage/sites/<slug>/` is git-tracked, has no tenant, and is keyed by a human-chosen directory name (`xgd`, `gigabytealchemy`). My read is the rule is about the multi-tenant database and the local authoring tier stays slug-keyed — but the ticket says "across the schema" and should say which schema.

Once those are settled I'll write the plan and the ticket body update.

<!-- xgd-chat-end -->