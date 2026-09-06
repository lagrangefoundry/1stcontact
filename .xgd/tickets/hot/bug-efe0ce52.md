---
uid: bug-efe0ce52
id: BUG-57
type: bug
title: 'public-site: /site/<key>/ returns 500 — deployed Worker predates the REQ-190
  baseline'
created_by: martin-github@westhead.me
created_at: '2026-09-06T20:44:03.515198+00:00'
updated_at: '2026-09-06T22:01:27.703691+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-595c6424
  severity: high
  commits:
  - working_sha: 73392632bbfc86344a8379894a945c8e49359a8d
    reconcile_sha: null
    main_sha: null
  version: 0.2.121
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


---

# Part 2 — `bin/smoke` skips 9 of its 11 checks

After the redeploy the suite passes, but the pass is thin: **2 ran, 9 skipped**.
Two unrelated causes.

## Cause A — five checks test a channel that no longer exists

`draft_root_redirects`, `draft_index_serves_html`, `draft_cache_and_robots_policy`,
`draft_miss_is_noindex_404` and `draft_assets_resolve` all address
`/site/<slug>/draft/<sha>/…`.

REQ-149 D7 **deleted that channel**, along with the `1c deploy` that was the only
thing producing sha-addressed snapshots and the deploy manifest that indexed
them. `apps/public-site/src/routes.ts` says so in its own header, and `draft` is
an ordinary path segment there again. So these five cannot pass: without
`--draft` they skip forever, and with it they would all fail against a route the
grammar no longer has. They are dead checks kept alive by a skip.

## Cause B — the remaining four are argument-gated, and the arguments are stale or derivable

- `unpublished_slug_indistinguishable`, `published_root_redirects` — need
  `--slug`. Still meaningful, but **`--slug` is the wrong word now**: the first
  path segment is the site's own 128-bit key, not a chosen name ([[REQ-190]]).
- `control_app_challenges_unauthenticated` — needs `--control-origin`. That is
  not an operator choice: `apps/control-app/wrangler.toml` declares exactly one
  route, `app.1stcontact.io/*`, and public-site owns `*.1stcontact.io/*` with
  `app` reserved. It is derivable from `--origin`.
- `control_app_workers_dev_closed` — needs `--workers-dev-origin`. Genuinely not
  derivable: the hostname embeds the account subdomain, which is nowhere in the
  repo.

## Behaviour this ticket adds

**1. The draft channel leaves `bin/smoke` with the channel.** The five `draft_*`
checks and the `--draft` flag are removed. Nothing is kept as a stub — a check
that can only skip is the half-present feature `CLAUDE.md` forbids.

**2. Their coverage is ported onto the one channel that exists.** Four checks,
gated on the site key rather than on a second flag:

- `published_index_serves_html` — `/site/<key>/` answers 200 with
  `text/html; charset=utf-8`.
- `published_cache_policy` — the response carries `cache-control:
  public, max-age=60`. This is `PUBLISHED_CACHE` in
  `apps/public-site/src/index.ts`, and no check asserts it against a live origin
  today.
- `published_miss_is_404` — a missing asset under a published site answers 404.
  `index.ts` states the invariant ("a missing object is a 404 and never a
  directory listing"); nothing proved it on a deployed origin.
- `published_assets_resolve` — every same-origin asset the published index
  references answers 200 with the content type its extension implies, following
  one level into CSS so `@font-face` targets are covered. This is the highest
  value check in the file and today it can never run.

**3. The URL segment is called what it is ([[REQ-190]]).** `--slug` becomes
`--site-key`; `unknown_slug_not_found` becomes `unknown_site_not_found`;
`unpublished_slug_indistinguishable` becomes `unpublished_site_indistinguishable`.
The absent-site constant is renamed with them. No alias is kept for `--slug`:
an unknown argument is already an error, so the rename is loud rather than
silently accepted under the old name.

**4. `--control-origin` defaults to `app.<host>` of `--origin`.** So
`control_app_challenges_unauthenticated` runs on a bare `bin/smoke`. An explicit
`--control-origin` still overrides it, and the derivation is skipped when it
cannot be formed.

**5. `--workers-dev-origin` stays explicit**, and so stays skipped by default.
It is the one argument the repo cannot supply, and a wrong guess would assert
against a hostname belonging to someone else.

## Expected result

`bin/smoke` with no arguments: **3 run** (apex, unknown site, control-app
challenge), 6 skipped. With `--site-key <key>` against a published site: **8
run**, 1 skipped. No check in the file is unreachable.

## Test plan

UATs `test_UAT_FC_BUG-57_*` driving `runSmoke` against a fake origin, covering:
the removed flag is now rejected; the four published checks pass against a good
origin and fail against a broken one; the renamed checks appear under their new
names; `--control-origin` is derived from `--origin` and overridable.

`tests/reconciliation-platform-build-deploy-smoke.test.ts` and
`tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` assert the old check names and
the draft channel; both are updated to the new behaviour rather than left
asserting a channel that is gone.


## Refinements made while implementing

**The `--control-origin` derivation is limited to the apex this repo names, not
generalised to `app.<host>`.** Point 4 above said "defaults to `app.<host>` of
`--origin`", and that is wrong in a way that matters: pointed at a staging or
preview origin with no `app.` sibling, the fetch throws and the check reports a
FAILING control gate for a host that was never the control app. A false alarm on
the one assertion that says "the builder is not public" is worse than a skip. So
the apex and its control origin are declared as a pair — `https://1stcontact.io`
→ `https://app.1stcontact.io` — and any other `--origin` must name its control
app with `--control-origin` or the check skips.

**Every skip must name the one argument that would make that check run.** This
is the property that keeps the defect from recurring: a check that skips without
saying what it wants is indistinguishable from a check that can never run.
`--site-key` for the published-channel six, `--control-origin` and
`--workers-dev-origin` for the two Access ones, each named in its own skip
reason.

**The published cache policy is pinned to the Worker's, not merely restated.**
`PUBLISHED_CACHE` now appears in both `tools/generate/bin/smoke.mjs` and
`apps/public-site/src/index.ts`, because the script runs outside the Worker
bundle and cannot import it — the same arrangement, and the same reasoning, as
the content-type table. A UAT reads the Worker's own value and asserts a smoke
run agrees with it, so the pair cannot drift.

**One breakage may fail more than one check, and that is correct.** A site root
that stops serving is genuinely not serving HTML, not caching it and not
referencing assets — so the reconciliation suite's "exactly one check fails"
assertion becomes "the owning check plus exactly the ones that share its
response", which stays exact rather than loosening to "contains".