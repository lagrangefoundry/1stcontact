---
uid: bug-332da6eb
id: BUG-203
type: bug
title: 'bin/deploy: ships stale builder browser assets beside a fresh Worker'
created_by: EPIC-19
created_at: '2026-10-04T17:58:10.800589+00:00'
updated_at: '2026-10-04T21:01:09.321513+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: high
  story_points: 2
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-20fa21fe
---

## Symptom (2026-10-04)

After `bin/deploy --env dev`, the builder's browser UI was a day old. The comp board (REQ-378), the panel progress counter (REQ-379) and BUG-196's upload controls were all missing, while the server side of the same commits was live. So the consultant told the client a comp was "on the comparison board", and the client saw no board at all.

## Root cause

`bin/deploy` (~L340–390) **copies** `apps/control-app/dist-assets` into the snapshot. It doesn't build it, by design ("the Worker serves what it builds"). Only `bin/build` / `1c assets` rebuild `dist-assets`. At deploy time:

| | |
|---|---|
| `dist-assets/builder/plan-panel.js` | 10,180 bytes, built 2026-10-03 11:12, 0 occurrences of `plan-comps` |
| `src/builder/plan-panel.js` | 22,772 bytes, committed 2026-10-04 09:24, the comp board present |
| `.dev-snapshot/assets/builder/plan-panel.js` | 10,180 bytes: the stale copy |

The Worker bundle *is* rebuilt from source, so the server and the browser shipped from different commits, and nothing warned. That's the opposite of what the frozen dev snapshot exists to guarantee (EPIC-16: "I need to know what I'm running").

## Fix

`bin/deploy` must never ship browser assets older than the source it ships the Worker from. Either it builds `dist-assets` itself as part of the deploy, or it refuses with the exact command to run when any file under `src/builder/` (or anything `1c assets` consumes) is newer than its `dist-assets` counterpart. Building it is preferred: one command, one commit, no trap. The banner the dev server prints at start states the commit both halves were built from.

## Test plan

UAT named `test_UAT_FC_<TICKET-ID>_*`: with a builder source file newer than its `dist-assets` copy, `bin/deploy --env dev` produces a snapshot whose asset matches the source, or exits non-zero naming the stale file. It never succeeds with the stale copy.


## What changed (2026-10-04)

`bin/deploy` now builds the browser assets it ships. There's a new hook stage, `bin/deploy.d/assets/`, which runs **first** for every app at every target (local `--env dev` and the cloud upload alike), before `migrate` and `secrets`. Its one hook, `10-control-app-assets`, gates on `control-app` like the other hooks do and runs `1c assets`, the same asset build `bin/build` runs (~1s). So `dist-assets`, and the `src/generated/` modules the Worker imports, come from the same tree as the Worker bundle wrangler then builds. The dev snapshot's existing `commit` field, shown in the `bin/dev up` / `1c dev serve` banner, now truthfully names the commit both halves were built from.

- A failed asset build exits non-zero and stops that app's deploy, before any migration is applied.
- `--dry-run` builds nothing. It prints `would build apps/control-app/dist-assets (1c assets)`.
- The hook `cd`s to the repo root itself, so it doesn't depend on the caller's working directory.

## Design decisions

- **Build, don't refuse.** This is the ticket's preferred option: one command, no trap. A staleness check would have needed its own definition of "everything `1c assets` consumes"; building costs about a second and can't drift from that definition.
- **A hook stage, not a line in `bin/deploy`.** This keeps the script's rule that it knows nothing app-specific, and it makes the build testable without a full control-app deploy.
- **The stage is named `assets`, not `build`**, because the repo `.gitignore` ignores every `build/` directory.
- **No `1c kb ensure` before it**, unlike `bin/build`. `1c assets` already refuses a KB whose index is behind its corpus, so a deploy can't ship a stale KB either: it stops and names the command. Bringing the index forward needs a credential and a request, which is a build's job, not a deploy's.

## Test coverage

`tests/test_UAT_FC_BUG-203_deploy_builds_what_it_ships.test.ts`:
1. `a_stale_builder_asset_is_rebuilt_from_its_source`: a `dist-assets/builder` copy with stale bytes and an older mtime is rebuilt by the hook to match its source byte-for-byte, as is every other builder file, with the hook run from outside the repo.
2. `the_deploy_builds_before_every_other_hook_at_both_targets`: `bin/deploy --dry-run` at `--env dev` and `--env production` runs the `assets` stage before `migrate`.
3. `a_failed_build_stops_the_deploy`: a failing `assets` hook fails the deploy, no migrate hook runs, and nothing is reported as deployed.
4. `a_rehearsal_builds_nothing`: with `DEPLOY_DRY_RUN=1` the stale copy is left alone and the hook says what it would build.

A full `bin/deploy --env dev control-app` isn't run in the suite, because it would apply the control app's migrations to `.wrangler/state` (the only copy of the dev data). The chain is proved in parts instead: (1) the hook makes `dist-assets` match the source, (2)/(3) the deploy runs it before the ship step, and REQ-318 covers the ship step copying `dist-assets` into the snapshot.