---
uid: comment-6debbf66
id: COMMENT-2515
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T10:48:57.597438+00:00'
updated_at: '2026-09-10T10:48:57.597438+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ebd04b23
  kind: note
---

Report `report-ebd04b23` (REPORT-3716) created. **All five violations and the one warning from `report-718c7ce2` are now closed**, and every assertion written across both calls has been run.

## What unblocked this call

Last call I deferred findings 2 and 5 because both live in `test_UAT_AC964_…`, driven by `unstable_dev` — a `wrangler dev` child that won't start in this sandbox. That premise was too narrow. `test_UAT_AC1400_…` already drives the deployed Worker's **own `fetch` in-process** with a real Access team minting real RS256 tokens, no subprocess. `unstable_dev` was never needed to reach the entry point — only to reach a *store*. So both findings became verifiable, and **AC-964 now runs in 8ms where it previously timed out at 60s**.

## Finding 5 — AC-1401's two doors

The doors can't share a process: workerd has no `node:http` for `startBuilder`, and the node pool has no D1/R2 to give the Worker a store (`worker.fetch(request, env)` takes no deps parameter — I checked). So they share a *statement*: a new `tests/support/transport-contract.ts` declares status, content type, freshness and a door-independent body descriptor per route, and each leg asserts its own door against it.

I proved this binds both doors rather than merely passing: perturbing one declared content type in the shared module made **both legs fail** on the single edit. Reverted; both green.

## Finding 2 — AC-964's sweep

Split across two pools, the way the ledger already accepts for AC-965: a workerd leg sweeps **all four classes** (document, artifact, operation, rendered channel) admitted vs unadmitted over a real store with refusal-body comparison; the node leg keeps **real-token fidelity** for the two store-free classes.

One thing worth flagging: `access.ts` fails closed down *two* paths — a 503 for an unconfigured gate and a 401 for a configured gate with no token. Only the second is actually "a caller this host did not admit"; a sweep landing on the first would look identically green while proving nothing. Both legs now assert **401 specifically**, and I verified empirically that's the path taken. I also deleted AC-964's old worker-vs-builder byte comparison outright rather than moving it twice — it's AC-1401's claim now, and the AC's own text forbids restating it.

## Not fixed, and why

`test_UAT_AC965_…` still times out at 180s. It stands up `unstable_dev` deliberately — its subject is a Worker that *could not be configured*, which has to be stood up as one — so it can't be ported the way AC-964 was. I confirmed last call it fails identically on unmodified `HEAD`. It's on the validation report's *aligned* list, not among its findings: a sandbox limitation, not a coverage gap.

Full run: 15 suites, 42 tests passing, including the repo-wide naming and scope guards. No production code touched. `uat_coverage` deliberately not written — that field belongs to check/fix_uat_coverage.
