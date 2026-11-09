---
uid: bug-fa20b941
id: BUG-387
type: bug
title: 'Job container: production intercept refuses the platform call (ECONNREFUSED
  10.0.0.1:80)'
created_by: EPIC-32
created_at: '2026-11-08T20:51:42.310342+00:00'
updated_at: '2026-11-08T21:14:37.949645+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: critical
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cbcb6c7e
  commits:
  - working_sha: 6541e0488efe9f614b5d65a873c5fd5bb67beeb3
    reconcile_sha: null
    main_sha: null
  version: 0.2.833
  story_points: 2
---

## Symptom

On production (2026-11-08), every job-container step fails, so every consultant turn and every shop import stops before doing any work. BUG-385's diagnostic logging, deployed with container version 3, shows why. In two Carry on retries (`turn_4c78af20…` and `turn_c0fea102…`, 20:48–20:49 UTC):

- `job_container_intercept`: `available: true`, `outcome: "registered"`, `addr: "10.0.0.1:80"`, and the binding is a `Fetcher`. Registering the intercept reports success.
- `container_fetch_failed`, all 12 platform calls: `POST 10.0.0.1/call`, `platform: true`, cause `ECONNREFUSED`, `connect ECONNREFUSED 10.0.0.1:80`. The refusal comes back in under 60 ms.
- `platform_api_request`: none. No intercepted call ever reaches `PlatformApi`.

So the intercept registers without error but never catches the connection, and nothing is listening at that address. The `round` and `abandon` steps both fail this way, three attempts each, and the job ends as `job_lost`.

## Likely cause

`JobContainer.ready()` (`apps/control-app/src/agent-container.ts`) calls `start()` first. It then registers `interceptOutboundHttp(PLATFORM_ADDR, env.PLATFORM)`, where `env.PLATFORM` is a `[[services]]` binding from the Worker to itself, with `entrypoint = "PlatformApi"`. Local workerd accepts that, and production evidently doesn't. Cloudflare's container documentation (developers.cloudflare.com/durable-objects/api/container/) and its own `@cloudflare/containers` library take a different approach:
- they pass a loopback entrypoint, `ctx.exports.<Entrypoint>({ props })`;
- they register the intercept before `start()`.

`ctx.exports` needs a later `compatibility_date` than the Worker's `2025-07-01`, or the flag that enables it.

## Fix

- **Production turns run.** A consultant turn and a shop import on production reach the platform through the intercepted address. `platform_api_request` lines appear for the job, and `container_fetch_failed` for `10.0.0.1` stops.
- **The intercept's binding is the Worker's own loopback entrypoint**, `ctx.exports.PlatformApi(...)`, and not the `PLATFORM` service binding. Remove `PLATFORM`'s `[[services]]` entries from every environment if nothing else uses it.
- **The intercept is registered before `start()`.** Each new container gets its intercept again, since an intercept lasts only as long as its container.
- **`ctx.exports` is enabled in every environment** (top level, `env.dev`, `env.production`, and the staging pattern, EPIC-16 §R). Use either a later `compatibility_date` or only the flag that `ctx.exports` needs. If the date is raised, list in this ticket the behaviour changes between the two dates that touch this Worker, and why each is safe.
- **BUG-385's logging stays.** `job_container_intercept` keeps reporting the binding's kind and the outcome, so it now shows the loopback entrypoint.

Out of scope: making a missing intercept fail loudly, and the `abandon` step ending the job from the Worker side. Both are deferred in BUG-385 and need their own decision.

## Why free-coded

Every consultant and every shop import on production is unusable until this lands.

## Test plan

- `test_UAT_FC_<ID>_*`: in `JobContainer.ready()`, the intercept is registered before `start()`, with the binding the Durable Object hands it from `ctx.exports.PlatformApi`.
- `test_UAT_FC_<ID>_*`: every environment in `wrangler.toml` enables `ctx.exports`.
- The REQ-646 container rig (`tests/test_UAT_FC_REQ-646_agent_compute_in_containers.test.ts`) still completes a turn locally through the new binding.
- Operator, on production: deploy, then send "hello" in a builder. It gets a reply, and Workers Logs show `platform_api_request` lines and no `container_fetch_failed` for the job.


## What landed (6541e0488e)

- **Loopback binding.** `AgentContainer` (`agent-container-do.ts`) passes `JobContainer` the result of `ctx.exports.PlatformApi({ props: {} })`. If `ctx.exports.PlatformApi` is missing, the constructor throws an error that names `enable_ctx_exports`. It no longer reads `env.PLATFORM`.
- **Intercept before `start()`.** `JobContainer.ready()` registers `interceptOutboundHttp(PLATFORM_ADDR, binding)` and then calls `start()` and `monitor()`. A container that is not running gets its own intercept every time it starts. BUG-385's `job_container_intercept` line is unchanged, and it now reports the loopback `Fetcher`. A failed registration is logged as `failed` and throws, and the container is not started.
- **Only the flag, no date change.** The top-level `compatibility_flags` is now `["nodejs_compat", "enable_ctx_exports"]` and `compatibility_date` stays `2025-07-01`, so no other behaviour changes. `env.production` and `env.dev` set no `compatibility_flags` of their own, so they inherit this line. Any later `[env.<name>]`, staging included, inherits it too unless it overrides the line. The UAT checks every `[env.*]` in the file.
- **`PLATFORM` removed.** Its `[[services]]` entries are gone from the top level, `env.production` and `env.dev`, and so is `PLATFORM?: unknown` on `RouterEnv`. Nothing else used it.
- `tests/reconciliation-site-storage-port.test.ts` keeps the date pin on both apps. It pins public-site's flags as before, and pins the control app's flags with `enable_ctx_exports` added. `vitest.workers.config.mts` is unchanged, because no workerd suite runs the container.

## Evidence

- `tests/test_UAT_FC_BUG-387_container_intercept_loopback.test.ts`. It uses the real `AgentContainer`, with only `cloudflare:workers`' base class stubbed:
  - the intercept is registered before `start()` with the object `ctx.exports.PlatformApi` returned, and again for a new container;
  - an object without `ctx.exports` refuses to construct;
  - every environment, read with wrangler's `unstable_readConfig`, has `enable_ctx_exports`, the date `2025-07-01`, and no `PLATFORM` service.
- REQ-646 rig, run locally with Docker:
  - `container_reaches_stores_only_through_the_entrypoint` passes.
  - `full_message_runs_through_a_container`: 1,463 `platform_api_request` lines and no `container_fetch_failed`. Its later "The result of your Delegate call" assertion also fails on HEAD's code (checked), so that failure predates this change and is not part of it.
- `test_UAT_FC_REQ-393_loading_the_file_leaves_deployed_vars_unchanged` and `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` also fail with HEAD's `wrangler.toml`. They are not affected by this change.
- **Still for the operator:** deploy to production, then send "hello" in a builder.