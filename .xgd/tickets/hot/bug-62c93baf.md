---
uid: bug-62c93baf
id: BUG-390
type: bug
title: 'Job container: the platform address 10.0.0.1 is the container''s own address
  on Cloudflare'
created_by: EPIC-32
created_at: '2026-11-08T21:50:52.026772+00:00'
updated_at: '2026-11-08T22:09:27.343760+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: critical
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-bd34170d
  story_points: 2
  commits:
  - working_sha: 19fa608675d5d95b689fd99e993cddde6f9644a2
    reconcile_sha: null
    main_sha: null
  - working_sha: 4add1fb1060d03390552fbbd6c01def914fccc4b
    reconcile_sha: null
    main_sha: null
  version: 0.2.836
---

## Symptom

Consultant turns and shop imports on production still fail every step after BUG-387 (deployed as Worker version `e89a3296`, 2026-11-08 21:21 UTC, `turn_8e9f864f…`). Both of BUG-387's changes are live:
- `job_container_intercept` shows `outcome: "registered"` for `10.0.0.1:80`;
- `intercept_ms: 1` (registered before `start()`);
- the binding is `ctx.exports.PlatformApi`.

Yet every platform call from the container still gets `container_fetch_failed … POST 10.0.0.1/call … ECONNREFUSED connect ECONNREFUSED 10.0.0.1:80` within about 50 ms, and no `platform_api_request` line appears. The intercept is registered, and it never sees the traffic.

## Likely cause

On Cloudflare, **`10.0.0.1` is very likely the container's own address** (or an address on its own network). Cloudflare's own container API reference (developers.cloudflare.com/durable-objects/api/container/) uses `10.0.0.1:8080` as the container's address, for the Worker-to-container direction. Our server listens on `0.0.0.0:8080`, so a call to `10.0.0.1:80` reaches the container itself, where nothing listens on port 80. It is refused locally and never leaves the machine, so the intercept can't catch it.
- **This fits all the evidence:** the refusal is immediate, the intercept still reports success, nothing reaches the Worker, and local dev works, because Docker puts containers on a different subnet (172.x).
- **Cloudflare's intercept examples avoid private ranges.** They use addresses outside RFC 1918 (`15.0.0.1`, `203.0.113.0/24`) or hostnames, never `10.x`.
- **Ruled out:** region or placement hints, which cloudflare/containers issue #226 reports break interception. We use none.

## Fix

- **Production turns run.** A consultant turn and a shop import on production reach the platform. `platform_api_request` lines appear for the job, and `container_fetch_failed` for the platform address stops.
- **The platform address moves out of the private ranges, and stays closed when the intercept fails.** `PLATFORM_HOST` (`apps/control-app/src/agent-container.ts`) becomes an address that isn't routed on the internet and isn't private, for example `192.0.2.1` (RFC 5737 TEST-NET-1). If an intercept ever fails to apply, a call to it should fail rather than carry the job's token to a real host on the internet. That rules out real public space such as Cloudflare's example `15.0.0.1`. A hostname such as `platform.internal` is the alternative, but Cloudflare doesn't document how DNS answers an intercepted hostname with `enableInternet: true`, so the IP is preferred. The address is defined in one place, and `PlatformApi`'s host check uses the same constant.
- **The container logs its own network once, at boot**, as `container_network`, with:
  - its interfaces and their IPv4/IPv6 addresses (from `os.networkInterfaces()`);
  - whether the platform address is one of them or falls inside one of their subnets.
  This confirms the cause whatever the outcome. It logs no secrets.
- **BUG-385's and BUG-387's logging stays.**

## Why free-coded

Every consultant and every shop import on production is unusable until this lands.

## Test plan

- `test_UAT_FC_BUG-390_platform_address_is_documentation_space_and_one_constant`: the platform address is outside 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 and 127.0.0.0/8. It is not publicly routable space (it is inside a documentation range such as RFC 5737). The container's `PLATFORM_URL`, the intercept's address, and `PlatformApi`'s host check all use the same constant.
- `test_UAT_FC_BUG-390_container_network_logged_once_with_platform_addr_local`: the container logs `container_network` once at boot, with its interfaces, and with `platform_addr_local: true` when the platform address is one of them or in one of their subnets.
- The REQ-646 container rig still completes a turn locally through the new address.
- Operator, on production: deploy, then send "hello" in a builder. It gets a reply, and Workers Logs show `platform_api_request` lines for the job and the `container_network` line.
## What landed

- `PLATFORM_HOST` (`apps/control-app/src/agent-container.ts`) is `192.0.2.1` (RFC 5737 TEST-NET-1). It was `10.0.0.1`. `PLATFORM_ADDR` (`192.0.2.1:80`, the intercept's address), `containerEnv`'s `PLATFORM_URL`, and `PlatformApi`'s host check (`worker.ts` → `servePlatformApi(env, request, PLATFORM_HOST, …)`) all read that one constant. No `'10.0.0.1'` literal is left in the control app's source.
- `networkReport(job, platformHost, interfaces)` (`apps/control-app/src/job-diagnostics.ts`) builds the `container_network` line:
  - `interfaces`: name, family, address, cidr and internal for each address;
  - `platform_addr`;
  - `platform_addr_local`: true when the platform address is an interface's own address, or inside an interface's IPv4 subnet (from its cidr or netmask);
  - `platform_addr_matches`: which interfaces matched.
- The container's server (`apps/control-app/container/server.ts`) logs it once, at boot, from `os.networkInterfaces()`. It logs addresses only, never a token.
- BUG-385's and BUG-387's UATs now read `PLATFORM_ADDR`/`PLATFORM_HOST` instead of pinning `10.0.0.1`. Their logging is unchanged.

## Verification

- The BUG-385, BUG-387, BUG-389 and BUG-390 UATs pass, and `tsc --noEmit` is clean for the control app.
- REQ-646 rig: `container_reaches_stores_only_through_the_entrypoint` passes through the new address. That case is a real container making a `POST $PLATFORM_URL/call` through the intercept.
- REQ-646 rig: `full_message_runs_through_a_container` fails with *"to contain 'The result of your Delegate call'"*, and it fails the same way with this change reverted (baseline run on `10.0.0.1`). It predates this ticket, and no `container_fetch_failed` appears in it.
- Still to do: the operator's production check in the test plan.