---
uid: bug-869caac5
id: BUG-334
type: bug
title: 'bin/dev restart: leaves a service running when its pidfile is gone'
created_by: EPIC-19
created_at: '2026-11-03T22:45:52.773720+00:00'
updated_at: '2026-11-04T01:22:11.292735+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-9a3b903e
  commits:
  - working_sha: 2f0d9bc87afbceaafa2a7d659bff1a742c59c943
    reconcile_sha: null
    main_sha: null
  - working_sha: 556e34449d8ad6d2676205b210873b4ff9fda92a
    reconcile_sha: null
    main_sha: null
  version: 0.2.750
  story_points: 2
---

## Symptom

After a dev deploy, the builder showed "could not load https://127.0.0.1:8789/builder/main.js". `bin/dev restart` did not fix it. `1c ps` listed dev-worker, front, public-site and access-sim as answering but not started by `bin/dev`, with no start time. Only the filing service had a pidfile. The old dev-worker on 8786 kept serving its startup asset manifest, so every builder file returned 404. `bin/dev reap` followed by `bin/dev up` fixed it.

## Root cause (from reading tools/generate/src/cli/dev.ts)

- `devDown` removes a service's pidfile even when it could not stop the process. This is deliberate: it hands the process to `reap`. The `down` that does this reports failure, but only once, and the orphan stays on its port.
- A later bare `bin/dev restart` (no service names) reads only the pidfiles. With none for those services, it has nothing to stop and checks no ports. Its `down` half therefore reports ok.
- Its `up` half then finds each port answering and leaves the old process alone ("already answering, left alone"). `restart` exits successfully having replaced nothing.
- A named restart (`bin/dev restart dev-worker`) checks the service's port whether or not a pidfile names it, so it refuses honestly. The bare form, the one we tell operators to use when in doubt, does not.
- The builder's boot-failure message and `devRefresh`'s message both tell the operator to run `bin/dev restart`, which cannot work in this state.

How the four pidfiles were lost on 2026-11-03 is not confirmed. The likely cause is the deploy's `1c dev refresh` hitting a `down` that could not free a port.

## Fix

`bin/dev restart` must leave every selected service running a process it started itself, whether or not a pidfile names the old one:
- With or without service names, restart covers every selected service's port.
- A listener on that port that belongs to this checkout (the same cwd rule `reap` uses) is stopped and replaced, even with no pidfile. Listeners belonging to other checkouts or projects are still never touched; for those, restart refuses and names the owner.
- If a port still won't free, restart fails non-zero, says which port and process, and starts nothing.
- A bare `bin/dev down` gets the same port check, so it can no longer report "down" while one of this checkout's services is still answering.

## Test plan

UATs `test_UAT_FC_<ID>_*` in the existing dev-command test suite, using its fake kill/answers seams:
- A service of this checkout is answering with no pidfile. A bare `restart` stops it, starts a new one and writes a pidfile.
- A listener from another checkout is on a service port. `restart` refuses, names it, and leaves it running.
- The port won't free. `restart` exits non-zero and starts nothing.
- A bare `down` with an orphan of this checkout's on a service port does not report the environment down.


## What landed (tools/generate/src/cli/dev.ts)

- `devDown` now verifies EVERY selected service's port, named or not, pidfile or not. A bare `bin/dev down` reports "NOT fully down" while one of this checkout's processes still answers on a service port. It does not stop that unrecorded process itself (that stays restart's and `reap`'s job).
- "This checkout's" means a listener whose cwd is this checkout (`origin === 'this-checkout'`). It is narrower than `reap`'s `ours`, which also covers `.xgd` worktrees, because another worktree's server belongs to another session. Listeners on a service port that are not this checkout's are reported as `occupied`. They never fail a plain `down`; they are listed as "left alone".
- `devRestart` asks `down` to adopt: it SIGTERMs this checkout's unrecorded listener on each selected port (it never escalates, the same as `down`). It starts nothing if a port is still answering (it fails, naming the port and pid) or if any `occupied` listener holds a selected port (it refuses, names it, and leaves it running). Adopted processes appear in the report as "no pidfile named it; this checkout's".
- `devRefresh`'s advice for an answering service with no pidfile now says `bin/dev restart <service>` instead of `reap` then `up`, because restart now handles that case.
- BUG-147's leg `down_of_a_named_service_verifies_its_port_with_no_pidfile` relied on a bare `down` skipping the port check, which this ticket deliberately reverses. Only its comment changed; its assertions still hold.

## UATs

`tests/test_UAT_FC_BUG-334_restart_replaces_an_orphan.test.ts`, using real listeners, real lsof and real signals:
- `bare_restart_replaces_this_checkouts_orphan`
- `restart_refuses_another_checkouts_listener_and_names_it`
- `restart_fails_and_starts_nothing_when_the_port_will_not_free`
- `bare_down_does_not_report_down_with_an_orphan_answering`