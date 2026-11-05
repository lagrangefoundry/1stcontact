---
uid: bug-be4ce87c
id: BUG-342
type: bug
title: 'Dev cycle: one command must build, deploy and leave every dev service running
  the new code'
created_by: EPIC-19
created_at: '2026-11-04T17:42:55.897805+00:00'
updated_at: '2026-11-04T18:59:52.564697+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-100116e2
  commits:
  - working_sha: 55a612b070af502de143ab76f99c651c3f2f7059
    reconcile_sha: null
    main_sha: null
  - working_sha: ee7fb394fe39c554680dc88d62413bedb7738fd5
    reconcile_sha: null
    main_sha: null
  - working_sha: 10f7434440575ca5cfabf076b4b1556cbeb1a96d
    reconcile_sha: null
    main_sha: null
  version: 0.2.759
  story_points: 5
---

## Why

The operator needs a dev cycle that is one command and always ends in a working environment. Today it takes three commands (`bin/build`, `bin/deploy --env dev`, sometimes `bin/dev restart`/`up`/`reap`), each of which can report success while leaving a service down, stale or orphaned. The operator then has to diagnose process state by hand.

Seen on 2026-11-03/04 alone:
- `bin/dev restart` reported success while four services kept running old processes with no pidfile (fixed narrowly in BUG-334).
- `bin/deploy --env dev` ran cleanly while the dev worker had crashed earlier. Its restart step (`1c dev refresh`) only restarts services that are *still running*, so the worker stayed down and the builder said "the dev worker on port 8786 is not answering (connect ECONNREFUSED)".
- `bin/deploy` doesn't build. It ships whatever `bin/build` last produced, so forgetting `bin/build` silently deploys old code.
- The builder's boot-failure messages advise `bin/dev restart`, `bin/dev up`, `bin/dev restart dev-worker` or `bin/dev reap` depending on the failure, so the operator has to know which one applies.

## What the operator gets

**One command — `bin/deploy --env dev` — does the whole cycle and ends in a known-good state, or fails loudly naming exactly what isn't.**

1. **It builds first.** `bin/deploy --env dev` runs `bin/build` itself; a build failure stops the deploy. (`--env production` keeps whatever build policy it has today; only the dev target changes.)
2. **It deploys the snapshot** as today.
3. **It brings every dev service to "running the new snapshot", whatever state it found them in:**
   - running from `bin/dev`: restarted;
   - **dead with a stale pidfile:** started (this is today's gap);
   - **answering but started outside `bin/dev`** (no pidfile, this checkout's process): replaced, using BUG-334's rule;
   - **not running at all:** started. A dev deploy means "I want dev serving this", so an environment that was down comes up.
   - A port held by *another* checkout or project is never touched; the deploy fails and names it.
4. **It verifies before reporting success.** Each service must answer on its port, and the dev worker must serve a known asset from the new snapshot (e.g. `builder/main.js` → 200) and report the new snapshot's `deployedAt`. Only then does it print one line: `Dev is up: <services> serving <snapshot id> (deployed <time>)`.
5. **On failure it exits non-zero** with one short paragraph: which service, what was found (e.g. "dev-worker exited 1 within 10 s — last log lines: …") and where the log is. No list of alternative commands to try.

**Every message the builder or a tool shows for "dev isn't serving" names the same single command:** `bin/deploy --env dev`. The builder's boot-guard text and `1c ps`'s STALE hints are rewritten to say only that. `bin/dev up/down/restart/reap` remain for debugging, but no operator-facing message routes through them.

## Not in scope

- Auto-restarting a service that crashes *while running* (a watchdog/supervisor). Worth considering later; a crash is still surfaced, and the next `bin/deploy --env dev` recovers it.
- Production deploy behaviour.

## Test plan

`test_UAT_FC_<ID>_*` (dev command suite, using its fake spawn/kill/answers seams plus a stubbed build step):
- **The whole cycle from a dead worker:** dev-worker's pidfile names a dead process and its port is free. `bin/deploy --env dev` builds, deploys, starts dev-worker, verifies it serves the new snapshot, and prints the success line.
- **From an orphan:** this checkout's process answering on a service port with no pidfile is replaced, and a fresh pidfile is written.
- **From an environment that was down:** with every service down, the deploy starts them all.
- **Build failure:** the deploy stops before touching the snapshot or any service, and exits non-zero naming the build failure.
- **A service that won't come up** (exits immediately): the deploy exits non-zero, names the service, and quotes its last log lines.
- **Another project on a port:** the deploy refuses, names the owner, and touches nothing.
- **One command in messages:** the builder's boot-failure text and `1c ps`'s stale hint name `bin/deploy --env dev` and no other command.



## Implementation plan (added at start of free-coding, 2026-11-04)

- **Build first** (`bin/deploy`, local target only): before the workerd guard, fonts or any hook, `bin/deploy --env dev` runs `bin/build`. A failure prints `bin/deploy: the build failed — nothing was deployed and no dev service was touched.` and exits 1. `--dry-run` prints `would run bin/build` and builds nothing. The command is overridable via `DEPLOY_BUILD_CMD` (the test seam for a stubbed build). The cloud target is unchanged.
- **The last step, `1c dev refresh <apps>`, is rewritten** (`devRefresh` in `tools/generate/src/cli/dev.ts`) to bring every dev service to "running the new snapshot":
  1. It surveys every service port first. A listener that is not this checkout's on any of them → refuse, name it (port, pid, cwd), and stop or start **nothing**.
  2. Services serving a deployed app are replaced: running from a pidfile → stopped; stale pidfile → forgotten; this checkout's orphan → adopted and stopped (BUG-334's rule). A port that won't free → fail, start nothing.
  3. Then every service in the table is brought up, in dependency order. Down ones are started (including filing, and services for apps not deployed this time); ones already answering are left alone.
  4. **Verify**: every service answers. Every service serving a deployed app was started by this refresh, so its pidfile `startedAt` is after the snapshot's `deployedAt`. A service declaring a `probe` asset (dev-worker: `builder/main.js`) must return 200 **with the same bytes as the snapshot's copy**. The worker has no endpoint that reports `deployedAt`. Process start time after `deployedAt`, plus byte-identical assets, is the equivalent evidence, and it is the check that would have caught BUG-334's old asset manifest.
  5. Success prints one line: `Dev is up: <services> serving <app> <commit> (deployed <deployedAt>)`. Failure exits non-zero with one paragraph per failing service: what was found, the last log lines, and the log path. It suggests no alternative commands.
- **Messages**: the builder boot guard (loopback), the dev front's 502 ("dev worker … is not answering") and `1c ps`'s STALE hint now name only `bin/deploy --env dev`.
- **Supersedes BUG-307's "a deploy with nothing running starts nothing / says `bin/dev up`".** That UAT (`test_UAT_FC_BUG-307_deploy_with_nothing_running_says_bin_dev_up`) is deleted. BUG-307's boot-guard and STALE assertions are updated to the single command.



## What landed

- **`bin/deploy`**
  - **Build first, at the local target only.** `bin/deploy --env dev` runs `bin/build` before anything else: before the workerd guard, the fonts and the hooks. A failure prints `bin/deploy: the build failed — nothing was deployed and no dev service was touched.` and exits 1. `--dry-run` prints `would run …`. The cloud target is unchanged.
  - **The last step** is `1c dev refresh <apps>`, under the heading "Bring the dev environment up on the new snapshot". `set -e` makes its failure fail the deploy.
  - **Two documented seams.** `DEPLOY_BUILD_CMD` replaces `bin/build`. `DEPLOY_DEV_REFRESH_CMD` replaces `1c dev refresh` and is handed the app names. They exist so a test can ship a snapshot without a full build, and without starting or stopping the operator's real dev services on the real ports. REQ-318's and BUG-294's suites now set both to `true`, because they run a real `bin/deploy --env dev public-site`.
- **`devRefresh` / `formatRefresh`** (`tools/generate/src/cli/dev.ts`) are rewritten as described in the plan:
  - It refuses first, touching nothing, when a listener that is not this checkout's holds any dev service port.
  - It replaces the services that serve a deployed app: with a live pidfile, with a stale pidfile, or as this checkout's orphan.
  - It starts every service that is down. Services already answering that serve no deployed app (e.g. filing) are left alone.
  - It verifies that every service answers, that each replaced service was started by this refresh, and that a service with a `probe` serves the snapshot's own bytes.
  - On success it prints `Dev is up: <services> serving <app> <commit> (deployed <deployedAt>)`.
  - On failure it prints `Dev is NOT up — …`, with one paragraph per service: what was found, the last 8 log lines and the log path. No alternative commands.
- **`DevServeApp.probe` / `DevService.probe`.** dev-worker declares `builder/main.js`.
- **`devUp` failures** now carry their `log`. A refusal's detail now says how long the service lasted (`exited with code 1 within N s`).
- **Messages.**
  - Boot guard on loopback: "Run `bin/deploy --env dev` — it builds, deploys and brings every dev service up on the new snapshot."
  - Dev front 502: "…is not answering (…). Run `bin/deploy --env dev` — …".
  - `1c ps` / `formatStale`: "`bin/deploy --env dev` builds, deploys and brings every dev service up on the new snapshot." The per-row "restart it" is gone.
  - `bin/dev`'s header now points operators at `bin/deploy --env dev` and keeps its verbs for debugging.

## Design decisions made during implementation

- **No `deployedAt` endpoint on the worker.** Freshness is shown by two facts instead: the serving process was started by this refresh, after the snapshot was written, and the probe asset is byte-identical to the snapshot's copy. That catches both a crashed worker and one holding an old asset manifest. Adding a worker endpoint would have changed the control app for no extra evidence.
- **Filing and the services of apps not deployed this time are started if down, but not restarted if up.** A deploy hasn't changed them.
- **Another checkout's listener is checked across every service port before anything is stopped.** A refusal therefore leaves the environment exactly as it was found.

## UATs

`tests/test_UAT_FC_BUG-342_one_command_dev_cycle.test.ts` (real processes, real ports 8700–8709, real lsof and signals; the dev-worker stand-in is an HTTP server that reads the snapshot's assets at startup):
- `the_whole_cycle_from_a_dead_worker`
- `an_orphan_serving_old_bytes_is_replaced`
- `an_environment_that_was_down_comes_up`
- `a_service_that_will_not_come_up_is_named_with_its_last_log_lines`
- `another_projects_listener_is_refused_and_nothing_is_touched`
- `deploy_builds_then_ships_then_brings_dev_up`: the real `bin/deploy --env dev public-site`, with build and refresh stand-ins that journal when they ran and what they saw.
- `build_failure_stops_the_deploy`: the real `bin/deploy`, with a failing build stand-in.
- `one_command_in_messages`: the boot guard, the front's 502 and the STALE hint.

BUG-307: `deploy_with_nothing_running_says_bin_dev_up` is deleted (superseded). Its STALE, boot-guard and refresh-report assertions are updated to the single command. Its deploy test now tracks `outcome.up` (the old `outcome.restart.up` path leaked the started stand-ins).