---
uid: bug-efe0ce52
id: BUG-57
type: bug
title: 'public-site: /site/<key>/ returns 500 — deployed Worker predates the REQ-190
  baseline'
created_by: martin-github@westhead.me
created_at: '2026-09-06T20:44:03.515198+00:00'
updated_at: '2026-09-06T20:46:58.568311+00:00'
completed_at: null
last_field_updated: severity
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-595c6424
  severity: high
---

## Symptom

`bin/smoke` against `https://1stcontact.io`:

```
  PASS  apex_resolves
  FAIL  unknown_slug_not_found
      an unknown slug returned 500, expected 404
```

Every `/site/<key>/…` request returns Cloudflare **error code 1101** (uncaught
Worker exception), HTTP 500. The apex passes because it never touches D1.

## Root cause

Code/schema skew between the deployed `1stcontact-public-site` Worker and the
remote D1 database.

- `db/migrations/0001_baseline.sql` — the REQ-190 "data is not a key" baseline,
  which drops `published_sites` and re-keys `site_revisions` on `site_id` —
  was applied to the **remote** database today: `d1_migrations.applied_at =
  2026-09-06 17:39:19`.
- The deployed `1stcontact-public-site` Worker is from **2026-08-24T22:24Z**,
  i.e. commit `5c012c3758`^. That build's `D1SiteStore.read()` runs:

  ```sql
  SELECT MAX(r.id) AS live FROM published_sites p
    JOIN site_revisions r ON r.tenant_id = p.tenant_id AND r.slug = p.slug
   WHERE p.slug = ?
  ```

  `published_sites` no longer exists, so the query throws, nothing catches it,
  and Cloudflare returns 1101/500.

`1stcontact-control-app` **was** redeployed today (2026-09-06T20:42Z), so only
public-site is behind. Confirmed remote schema is current: `site_revisions` has
`site_id`, and `published_sites` is absent from `sqlite_master`.

The code on `xgd-working` is already correct — current `site-store.ts` reads
`SELECT MAX(id) AS live FROM site_revisions WHERE site_id = ?`, which matches
the deployed schema.

## Fix

Operational, not a source change:

```
bin/build
bin/deploy public-site
bin/smoke
```

`bin/deploy` iterates `apps/*/` in sorted order (`control-app` then
`public-site`), so a run that aborted after control-app — or an explicit
`bin/deploy control-app` — leaves exactly this state.

## Open question (not yet scoped)

Nothing but a manually-run `bin/smoke` detects this class of skew: a migration
applied to remote D1 does not force the Workers that read it to be redeployed,
and the migrate hook runs per-app rather than per-database. Whether that
warrants a guard (a schema-version check the Worker asserts at boot, or a
deploy-time refusal when a Worker's build predates the last applied migration)
is a separate decision — file separately if wanted.

## Test plan

No source change, so no UAT. Verification is `bin/smoke` returning
`unknown_slug_not_found → 404` against the redeployed origin.
