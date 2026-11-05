---
uid: bug-ca01d2d1
id: BUG-352
type: bug
title: 'bin/build: the dry-run bundle builds the job container image before its server
  is bundled, so bin/deploy --env dev fails'
created_by: EPIC-32
created_at: '2026-11-05T00:44:07.140734+00:00'
updated_at: '2026-11-05T01:39:41.900973+00:00'
completed_at: null
last_field_updated: body
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  epic_parent: epic-24a2ec33
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-682f6dac
  story_points: 1
  commits:
  - working_sha: fd09ef94d092db047a6e9767ec464ee63462aeec
    reconcile_sha: null
    main_sha: null
  - working_sha: 374f8bd43eed9532223c8ffc9c4ac82b7919887c
    reconcile_sha: null
    main_sha: null
  version: 0.2.773
---

## Symptom

`bin/deploy --env dev` fails in its first step (Build), and nothing is deployed:

```
Building image 1stcontact-control-app-agentcontainer-production:worker
 => ERROR [5/5] COPY dist/server.mjs dist/server.mjs.map ./
"/dist/server.mjs.map": not found
bin/deploy: the build failed — nothing was deployed and no dev service was touched.

```

## Root cause

Two landed changes collide:

- **BUG-342:** `bin/deploy --env dev` runs `bin/build` first.

- **REQ-646:** adds `[[containers]]` to `apps/control-app/wrangler.toml`, and bundles `container/dist/server.mjs` in the deploy hook `bin/deploy.d/assets/20-control-app-container`. That hook runs after the build.

`bin/build` validates each app with `npx wrangler deploy --env production --dry-run --outdir dist` (bin/build:159). Since `[[containers]]` exists, wrangler's dry run also **builds the container image**, unless `--containers-rollout=none` is passed (wrangler 4.111 cli.js: the build is skipped only when `containersRollout === "none"`). REQ-646 added that flag to bin/deploy's own dry runs (lines 439, 448, 625) but not to bin/build's. So the image is built before its server bundle exists. The build context is empty because `container/dist/` is gitignored and was never built on this checkout.

## Fix

- `bin/build`'s dry run passes `--containers-rollout=none`. A build check validates the Worker bundle and does not build or push images; the real deploy builds the image after the hook has bundled the server.

- Nothing else changes: the image is still built by the real `wrangler deploy`, and by `wrangler dev` from the snapshot.

## Workaround until fixed

`node apps/control-app/container/build.mjs && bin/deploy --env dev`

This bundles the server first, so bin/build's unneeded image build succeeds. The hook then rebundles after the assets step.

## Test plan

UAT `test_UAT_FC_BUG-352_build_dry_run_passes_containers_rollout_none` (`tests/test_UAT_FC_BUG-352_build_dry_run_builds_no_image.test.ts`): on a checkout with no `apps/control-app/container/dist/`, `bin/build` succeeds, and the invocation it runs (captured through a stand-in `npx` on PATH) carries `--containers-rollout=none`.

## What landed

- `bin/build`'s bundle stage runs `npx wrangler deploy --env production --dry-run --containers-rollout=none --outdir dist`, with a comment giving the reason.

- **Superseded pin:** `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight` (`tests/reconciliation-platform-build-deploy-smoke.test.ts`) pinned the exact old invocation. Its expected string now includes `--containers-rollout=none`. The AC's intent (every discovered Worker is bundled against production) is unchanged.

- The UAT fails without the fix and passes with it. The other failures in the neighbouring build/deploy suites (AC1332, AC1333, AC1425, AC1427, REQ-393 `loading_the_file_leaves_deployed_vars_unchanged`) were already failing on clean xgd-working.