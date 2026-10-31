---
uid: bug-9b5ecc5c
id: BUG-307
type: bug
title: 'Local dev: a deploy leaves old code running, and ''bin/dev restart dev'' restarts
  only the front'
created_by: EPIC-19
created_at: '2026-10-28T02:22:38.762628+00:00'
updated_at: '2026-10-28T02:58:27.761442+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-640f4472
  commits:
  - working_sha: 0bdd6f4d9048281c45a3e21bd397228aed079870
    reconcile_sha: null
    main_sha: null
  - working_sha: b08618017366e438162da21b4ab669f6d76bcd07
    reconcile_sha: null
    main_sha: null
  - working_sha: 0eba85bc2d604e47ad36fac8216e6b8141e9afde
    reconcile_sha: null
    main_sha: null
  version: 0.2.695
  story_points: 5
---

## Symptom

On 2026-10-27/28 the operator ran `bin/deploy --env dev` and then `bin/dev restart dev`, as an assistant told them to. Two tests then ran on code older than what was deployed:
- **Dina's Diner 8 (01:16 UTC):** the BUG-304 fix wasn't running.
- **Dina's Diner 9 (01:51–02:17 UTC):** neither BUG-304 nor BUG-306 was running.

The proof is in the plans' change records: guides recorded without the `passed` marks the new code writes, and a first build that BUG-306's hold would have refused. `dev-worker` had been running since 2026-10-27T23:59:26Z, through deploys at 01:11:52Z and 02:07:57Z.

An earlier symptom of the same gap (2026-10-27 ~22:05): after a deploy, every `/builder/*.js` returned 404 because wrangler kept its startup asset manifest. The boot guard advised running `1c assets`, which was wrong.

## Root cause

1. **`bin/dev restart dev` restarts only the HTTPS front.** Since BUG-295, the service named `dev` is the HTTP/2 front on 8789. The wrangler process serving the snapshot is `dev-worker`. The name reads as "the dev environment", so restarting "dev" looks complete and isn't.
2. **A deploy relies on wrangler's hot reload,** which reloads `worker.js` but not reliably: it keeps the old asset manifest, and on Dina 8 and 9 it kept old code even though it logged "Reloading local server". Nothing restarts the services after `bin/deploy --env dev`.
3. **Nothing says a running service is older than the snapshot it serves.**

## Fix

1. **Bare `bin/dev restart` restarts every service.** It already does; keep that, pin it with a test, and say so first in `bin/dev`'s usage.
2. **Rename the front service from `dev` to `front`.** The pidfile, `1c ps`, `DEV_SERVICES` and docs follow. `bin/dev restart dev` then fails with "Unknown dev service 'dev'", listing the real names, instead of silently doing a partial restart. No alias: an alias would keep the trap.
3. **`bin/deploy --env dev` restarts the running dev services itself** when it has replaced a snapshot they serve. Each service in `DEV_SERVICES` names the app whose snapshot it serves or sits in front of (`snapshot`): `dev-worker`, `front` and `access-sim` → `control-app`; `public-site` → `public-site`; `filing` none. The deploy's last step is a new verb, `1c dev refresh <app>…`, which restarts (down then up) the running `bin/dev`-started services linked to the deployed apps and prints what it restarted. `front` and `access-sim` run from the checkout rather than a snapshot, but they front the control app, so a control-app deploy restarts them too (simpler than detecting whether their code changed). Filing is never restarted. If nothing is running, it says "Now serve it: bin/dev up". A service answering on its port with no pidfile is reported as not restarted (`bin/dev reap` then `bin/dev up`). `dev refresh` is workerd-gated like `dev restart`.
4. **Stale processes are reported.** `1c ps` (and its `--json`, as `stale`) and `bin/dev up`/`restart` mark any running, pidfile-recorded service with a `snapshot` link whose start time is earlier than the `deployedAt` of the snapshot it serves: "started before the snapshot it serves was deployed; restart it".
5. **The boot guard's advice on dev.** When the builder fails to load an asset on the dev environment (the page is on loopback: `127.0.0.1`, `localhost`, `[::1]`), its message says to restart the dev services (`bin/dev restart`), not "run `1c assets`".

## Test plan

- `test_UAT_FC_BUG-307_bare_restart_restarts_every_service`: `bin/dev restart` with no arguments brings down and starts every service in `DEV_SERVICES`. Each pidfile's `startedAt` is newer afterwards.
- `test_UAT_FC_BUG-307_dev_is_not_a_service_name`: `bin/dev restart dev` exits non-zero, naming the known services, including `front`.
- `test_UAT_FC_BUG-307_deploy_restarts_what_serves_the_snapshot`: after `bin/deploy --env dev` replaces the control-app snapshot with dev services up, `dev-worker` has been restarted (its `startedAt` is later than the snapshot's `deployedAt`), and the output names it — `front` too; `filing` and `public-site` keep their pids. Driven through `dev refresh` with stand-in listeners in a temp root (a real deploy would restart the operator's own services); that `bin/deploy` calls `dev refresh "${targets[@]}"` after `ship_local` is checked in the script.
- `test_UAT_FC_BUG-307_ps_flags_a_service_older_than_its_snapshot`: with a `dev-worker` pidfile older than the snapshot's `deployedAt`, `devStale` reports it (filing, with no snapshot, is never stale), the `ps` verb prints `formatStale`, and `bin/dev up`'s report carries a `STALE` row.
- `test_UAT_FC_BUG-307_boot_guard_advises_restart_on_dev`: the dev boot-guard message for a missing builder asset names `bin/dev restart`.
- `test_UAT_FC_BUG-307_deploy_with_nothing_running_says_bin_dev_up`: `dev refresh` with no service running restarts nothing and says `bin/dev up`.

Existing UATs that pinned the name `dev` (BUG-150, BUG-295, REQ-318, REQ-322) now pin `front`. Off loopback the boot guard's hint is unchanged (REQ-149/BUG-135 still assert `1c assets`).