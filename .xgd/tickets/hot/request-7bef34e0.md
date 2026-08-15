---
uid: request-7bef34e0
id: REQ-144
type: request
title: Build, deploy and smoke-test scripts, and the [vars] inheritance bug behind
  the production 503
created_by: xgd
created_at: '2026-08-15T20:32:18.642216+00:00'
updated_at: '2026-08-15T21:31:24.394551+00:00'
completed_at: null
last_field_updated: status
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  ready_since: '2026-08-15T20:34:18.239366+00:00'
---

# Build, deploy and smoke-test scripts — and the `[vars]` bug that makes production 503

One command to build, one to deploy, one to prove the deploy worked. Plus the configuration bug
that means `app.1stcontact.io` cannot currently work at all.

## 1. The bug

`apps/control-app/wrangler.toml` declares `BUILDER_ORIGIN` under a **top-level `[vars]`** and
does not repeat it under `[env.production]`. Wrangler does **not** inherit `vars` into named
environments, so the deployed Worker sees no `BUILDER_ORIGIN` and returns its own 503:

> `BUILDER_ORIGIN is not configured. Start the builder origin with '1c builder' ...`

The repository already knows this rule and states it — `apps/public-site/wrangler.toml` repeats
its R2 binding under `[env.production]` with the comment *"a named environment does not inherit
bindings"*. control-app simply did not follow it.

Note the 503 is **not** the whole problem: `BUILDER_ORIGIN` points at `http://localhost:8790`,
and a deployed Worker cannot reach localhost by any value of that variable. So this ticket makes
the failure *honest and diagnosable*; the origin only stops being a laptop when [[REQ-145]] and
[[REQ-146]] land.

## 2. Why scripts, and what they must not be

`package.json` has `deploy:public` / `deploy:control` / `dryrun:*`. What is missing is
everything around them: nothing builds the builder client, applies D1 migrations, pushes
secrets, or checks afterwards that the thing that deployed actually serves.

The scripts are **one path**, used by the operator and by any future automation alike. A deploy
that is done differently by hand than by script is a deploy whose failures nobody can reproduce.

## 3. Deliverables

- `bin/build` — builds every deployable artifact; fails loudly on a missing shared-store
  component rather than emitting a broken import map.
- `bin/deploy` — applies D1 migrations, deploys the Workers, reports what moved. Takes a target
  so `--dry-run` and a real deploy are the same code path.
- `bin/smoke` — post-deploy assertions against the **live** origin, exiting non-zero on failure.
  Must cover what [[CHAT-11]] verified by hand for `public-site`: apex resolves, the
  trailing-slash 301 holds, a rendered snapshot's referenced assets all return 200 with correct
  content types, `cache-control` and `x-robots-tag` are right on the draft channel, and an
  unknown slug 404s without leaking a distinction.
- Secrets documented and pushed via `wrangler secret`, never committed. `ANTHROPIC_API_KEY` is
  the first one ([[REQ-146]]).

## 4. Acceptance criteria

1. `[env.production]` carries every var and binding control-app needs; a dry-run deploy shows
   them resolved rather than absent.
2. A UAT asserts that for each Worker, every top-level `vars`/binding key is also present under
   `[env.production]`. This class of bug does not recur silently — it is the second time
   inheritance has bitten this repo.
3. `bin/build` from a clean checkout produces every artifact the deploy needs.
4. `bin/smoke` passes against the current live `public-site` **before** anything else changes,
   proving the script tests reality rather than encoding hopes.
5. `bin/smoke` fails non-zero, with a message naming the failed assertion, against a
   deliberately broken deploy.
6. No secret value appears in the repository, in `wrangler.toml`, or in script output.

## Origin

[[CHAT-25]] — operator asked explicitly for build/deploy scripts. The `[vars]` bug was found
while reading control-app's config during that conversation; production has been returning 503
since it was deployed.