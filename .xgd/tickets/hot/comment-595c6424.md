---
uid: comment-595c6424
id: COMMENT-2301
type: comment
title: Comment on bug BUG-57
created_by: xgd
created_at: '2026-09-06T20:44:32.622200+00:00'
updated_at: '2026-09-06T20:47:10.073038+00:00'
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

<!-- xgd-chat-end -->