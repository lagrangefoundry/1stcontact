---
uid: comment-595c6424
id: COMMENT-2301
type: comment
title: Comment on bug BUG-57
created_by: xgd
created_at: '2026-09-06T20:44:32.622200+00:00'
updated_at: '2026-09-06T22:02:49.984965+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-efe0ce52
  kind: chat_transcript
---

<!-- xgd-turn id="cc3d046b-01b2-4f4d-b565-8b041fb0ef6b-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:44:12.584277+00:00" -->
#### You
```
((.venv-working) ) martin@nyx 1stcontact % bin/smoke
  PASS  apex_resolves
      200 text/plain; charset=utf-8
  FAIL  unknown_slug_not_found
      an unknown slug returned 500, expected 404
  skip  unpublished_slug_indistinguishable
      no --slug given
  skip  published_root_redirects
      no --slug given
  skip  draft_root_redirects
      no --slug/--draft given
  skip  draft_index_serves_html
      no --slug/--draft given
  skip  draft_cache_and_robots_policy
      no --slug/--draft given
  skip  draft_miss_is_noindex_404
      no --slug/--draft given
  skip  draft_assets_resolve
      no --slug/--draft given
  skip  control_app_challenges_unauthenticated
      no --control-origin given
  skip  control_app_workers_dev_closed
      no --workers-dev-origin given

Smoke FAILED against https://1stcontact.io: 1 failed, 1 passed, 9 skipped.
Failed: unknown_slug_not_found
((.venv-working) ) martin@nyx 1stcontact %

```

<!-- xgd-turn id="cc3d046b-01b2-4f4d-b565-8b041fb0ef6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:47:09.688199+00:00" -->
#### Claude
Diagnosed. This isn't a code bug — it's a stale deployment.

**The 500 is a stale deployment, not a code bug.**

What's happening:

- `db/migrations/0001_baseline.sql` — the REQ-190 baseline that drops `published_sites` and re-keys `site_revisions` on `site_id` — was applied to **remote** D1 today at `17:39:19` (`d1_migrations.applied_at`).
- The deployed `1stcontact-public-site` Worker is from **2026-08-24 22:24Z**, one commit before `5c012c3758`. That build still runs:

  ```sql
  SELECT MAX(r.id) AS live FROM published_sites p
    JOIN site_revisions r ON r.tenant_id = p.tenant_id AND r.slug = p.slug
   WHERE p.slug = ?
  ```

  `published_sites` no longer exists → the query throws → uncaught → Cloudflare 1101 → HTTP 500. The apex passes because it never touches D1.

- `1stcontact-control-app` **was** redeployed today at `20:42Z`. Only public-site is behind. `bin/deploy` walks `apps/*/` sorted (`control-app`, then `public-site`), so either that run aborted after control-app, or it was `bin/deploy control-app`.

I verified the remote schema is current (`site_revisions` has `site_id`; `published_sites` absent from `sqlite_master`), and the source on `xgd-working` already matches it — `apps/public-site/src/site-store.ts:117` reads `SELECT MAX(id) AS live FROM site_revisions WHERE site_id = ?`.

**Fix is `bin/build && bin/deploy public-site`, then re-run `bin/smoke`.** That's a production deploy, so I haven't run it — say the word and I will.

BUG-57 is filled in with the diagnosis. One thing I flagged there but didn't act on: nothing except a hand-run `bin/smoke` detects this skew — a remote migration doesn't force the Workers reading that database to redeploy, and the migrate hook is per-app rather than per-database. Whether that deserves a guard (boot-time schema assertion, or a deploy refusing a Worker build older than the last applied migration) is a separate call; tell me if you want a ticket for it.

<!-- xgd-turn id="d2fa62f6-0500-4ce0-b1ec-3daa7f46d859-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T21:47:14.924867+00:00" -->
#### You
ok smoke passed - but why are 9 of 11 tests being skipped? Can we either update them or remove them?

<!-- xgd-turn id="d2fa62f6-0500-4ce0-b1ec-3daa7f46d859-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T22:02:49.899898+00:00" -->
#### Claude
Let me check a few things before proposing.

Here's what the 9 skips actually are — two very different problems:

Now the smoke script itself.

Now the option handling and the checks themselves.

Now the `bin/smoke` launcher docs, which still advertise `--slug`/`--draft`.

Now let me sanity-check the script runs and behaves.

The derivation as written would guess wrong for a non-default `--origin` and produce a false failure. Tightening it:

Now the two existing test files that assert the old behaviour.

Now AC-1336 through AC-1340.

That's the known worktree artifact — generated sources aren't checked in.

Now the ticket language for what the implementation refined, before committing.

Done. Merged to `xgd-working` as `7339263`, BUG-57 is `free_coded` at 0.2.121.

**Why 9 skipped — two unrelated causes:**

**Five were dead.** `draft_root_redirects`, `draft_index_serves_html`, `draft_cache_and_robots_policy`, `draft_miss_is_noindex_404`, `draft_assets_resolve` all addressed `/site/<slug>/draft/<sha>/…`. REQ-149 D7 deleted that channel with the `1c deploy` that was its only producer — `routes.ts` treats `draft` as an ordinary segment again. Without `--draft` they skipped forever; *with* it they'd have failed against a route the grammar no longer has.

**Four were argument-gated**, two of those arguments stale or derivable.

**What I did:**

- **Removed** the five draft checks and `--draft` — not stubbed; `--draft` is now a rejected argument so the old invocation says so.
- **Ported their value** onto the published channel, gated on the same site key the other checks needed: `published_index_serves_html`, `published_cache_policy` (pins `PUBLISHED_CACHE` against the Worker's own value — nothing asserted that before), `published_miss_is_404`, `published_assets_resolve` (the asset crawl incl. one level into CSS — the most valuable check in the file, and it could never run).
- **Renamed** `--slug` → `--site-key`, `unknown_slug_not_found` → `unknown_site_not_found`, `unpublished_slug_indistinguishable` → `unpublished_site_indistinguishable`. The segment has been a 128-bit site key since REQ-190.
- **Defaulted `--control-origin`** to `https://app.1stcontact.io` when `--origin` is the apex that names it, so the REQ-147 gate runs on a bare `bin/smoke`.

One judgment call worth flagging: I did **not** generalise that default to `app.<host>` of any `--origin`, which was my first cut. Against an origin with no `app.` sibling the fetch throws and the check reports a *failing* control gate for a host that was never the control app — a false alarm on "the builder is not public" is worse than a skip. Any other origin must name `--control-origin`.

`--workers-dev-origin` stays explicit and stays skipped by default: the hostname embeds the account subdomain, which is nowhere in the repo.

**Result:** 11 checks → 9, none unreachable. A bare run goes 2 passed/9 skipped → **3 passed/6 skipped**; with `--site-key` against a published site, 8 run. UATs assert this as a property, not a count: supplying every input leaves nothing skipped, and every skip names the one argument that would run it.

Tests: 70 passing across the new BUG-57 suite and the three existing suites I had to update (REQ-144, REQ-147, the story-d5167ced reconciliation suite all asserted the draft channel).

One caveat on verification: `./bin/smoke` can't reach the network from my sandbox — Node's fetch ignores `HTTPS_PROXY` and this Node predates `--use-env-proxy`, so every check reports `threw: fetch failed`. I verified against production by driving `runSmoke` with a curl-backed fetch: 3 passed, 7 skipped, `control_app_challenges_unauthenticated` correctly seeing the 302 to `lagrangefoundry.cloudflareaccess.com`. Worth re-running `bin/smoke` yourself to confirm in a normal shell.

<!-- xgd-chat-end -->