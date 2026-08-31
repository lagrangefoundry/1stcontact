---
uid: report-de3e6b22
id: REPORT-3024
type: report
title: 'Reconciliation Review: commits (BUNDLE-21)'
created_by: xgd
created_at: '2026-08-31T19:07:39.239124+00:00'
updated_at: '2026-08-31T19:07:39.239124+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-78f4e2fe
  anchor_uid: bundle-78f4e2fe
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-78f4e2fe (BUNDLE-21 = BUG-36 + BUG-37 + BUG-38)
**Stories Reviewed**: 5

This is the third review of this bundle. The two previous ones (REPORT-3018,
REPORT-3021) both passed intent fidelity, behavioural coverage and plan-item
accounting and failed on Step 5b alone. REPORT-3021's five blocking findings are
closed, and I confirmed that by **running** the file rather than by reading the
fix report: `npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts`
→ **12 passed, 1 failed**, the single failure being the excluded worktree
artifact. The secondary AC-1055 finding that review recorded is closed too.

The anchor has no comments; the intent is the bundle body alone, which carries
all three tickets in full including BUG-36's operator-approved scope addition.

## Behavior Inventory

7 behaviours across the five free-coded commits (`ea48502d`, `2058a164`,
`0fe586d1`, `999579b3`, `63df97c9`), read independently from the tree:

1. `storeFor` registers the configured account on the cold path and retries once,
   guarded on `err.reason !== 'unknown'` (`apps/control-app/src/store.ts:85-95`);
   `storeForImport`, `importStore` and `mintedKey` return **no grep hits** in
   `apps/`, `tools/` or `bin/`.
2. `UnknownTenantError` carries a typed `reason: 'unknown' | 'inactive'`
   (`tools/generate/src/store/d1r2-store.ts`).
3. The `ASSEMBLED` memo is keyed `(tenantId, slug)`, holds `{ version, result }`,
   is replaced on a version move, and is deleted in `forget` and on a missing row
   (`d1r2-store.ts:185, 401-405, 806-824`).
4. `[observability]` is declared twice with `head_sampling_rate = 1`, the
   production table placed **after** `routes` (`wrangler.toml:35-37, 140, 148-150`).
5. `pushSite` sends the client-id/secret pair with `redirect: 'manual'`; the
   assertion header is gone. `bin/access-token` provisions and rotates.
6. `slugForSession` resolves via `deps.store.hasDraft` with no per-process map
   (`tools/generate/src/cli/ai/host-core.ts:292-297, 576`).
7. `package.json` 0.2.12 → 0.2.13 — bookkeeping, no behaviour.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `storeFor` registers the configured account on the cold path; the second opener is deleted | Covered | story-e674c60a | AC-1449 (new), AC-965 and AC-1402 (modified) |
| 2 | `UnknownTenantError.reason` is a discriminant a caller branches on | Covered | story-fde7370b | AC-1387, sharpened from "distinguishable prose" to "a value, not only prose" |
| 3 | Assembled-draft memo: live-version invalidation, bounded, never misattributed, account-scoped | Covered | story-fde7370b | AC-1447, AC-1448 |
| 4 | Unsampled invocation-log retention, both environments, placed after `routes`, counted as no binding | Covered | story-d5167ced | AC-1454, AC-1455 — **executed, 2 passed** |
| 5 | Push presents the service-token pair; half a credential and a sign-in bounce read as refusals; provisioning persists no secret | Covered | story-182e8cb9 | AC-1450–AC-1453 (new), AC-1376 (modified) |
| 6 | Session id resolves against account-scoped storage; a turn runs on a process that never opened it | Covered | story-a58a0974 | AC-1055 (restated), AC-1456 (new) |
| 7 | Version bump 0.2.13 | Covered (no behaviour) | — | Correctly generated no story |

**Every active AC has a UAT.** Machine-checked across all five stories: 107
active acceptance criteria, 0 without a matching `test_UAT_AC{N}_*` on disk.

## Intent Fidelity

PASS. Both deliberate reversals are **flagged in the criteria themselves**, not
silently absorbed:

- **AC-965** states its own supersession: *"A third case used to be asserted here
  and is deliberately no longer... refusing it was the outage rather than the
  diagnosis of one."* The two cases that remain failures are unchanged.
- **AC-1055** is restated to require the derivable identifier to **resolve**,
  with the reason given (*"it is the only thing a client carries between opening
  a conversation and speaking in it"*), while the authority property it exists to
  protect survives and is strengthened to an account-scoped storage lookup.

All three deliberate non-changes the operator declared are recorded under
`## Reconciliation Decisions` rather than reconciled into criteria:

- the router's dead `PREVIEWS` render cache (story-fde7370b — *"deliberately left
  as it is: a cached renderer would hold the store handle it was built with"*);
- `NODE_USE_ENV_PROXY`, kept out of the publish path (story-182e8cb9 — *"a
  property of one caller's network, not of publishing"*);
- BUG-37's confirmed free-plan CPU-ceiling root cause, which generates no
  criterion because *"the matrix cannot hold a billing plan"* (story-fde7370b,
  cross-referenced from story-d5167ced).

No story claims behaviour absent from the code, and nothing in the code is
documented as intended where the intent says otherwise.

## Ungrounded Stories

None.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Cloud Site Store (D1 + R2 adapter) | story-fde7370b | ✓ AC-1447, AC-1448 added; AC-1387 modified |
| 2. Builder Workspace Origin — deployment bootstrap | story-e674c60a | ✓ AC-1449 added; AC-965, AC-1402 modified |
| 3. Operator Access Gate — automation credential | story-182e8cb9 | ✓ AC-1450, AC-1451, AC-1452, AC-1453 added; AC-1376 modified |
| 4. Platform Deploy Configuration — invocation logs | story-d5167ced | ✓ AC-1454, AC-1455 added; AC-1341 modified |
| 5. AI Site Assistant — session resolution | story-a58a0974 | ✓ AC-1456 added; AC-1055 modified |

No plan item was dropped. Each modified AC's text was read in full and matches
the plan's `acceptance_criteria_changes` for that item.

## Step 5b — Evidence Sufficiency

### Closed since REPORT-3021, verified by execution

All five blocking findings were in
`tests/reconciliation-platform-build-deploy-smoke.test.ts`. I ran it: **12
passed, 1 failed**.

- **AC-1341** — `missingFromEnv` now implements the one-variable exception the
  criterion states, via an exported `DEV_ONLY_VAR = 'ACCESS_DEV_OPEN'`
  (`tests/support/wrangler-toml.ts:115-141`). The UAT asserts both halves the
  Verification names — the exempt variable reports nothing missing against the
  real tree, and a second top-level variable dropped from the named environment
  is still reported **by name and only that one**. It also adds the
  Verification's third paragraph, which no UAT covered: `workers_dev` and the
  retention keys are repeated under `[env.production]` and stay invisible to the
  variable and binding sets. The latent `BUILDER_ORIGIN` assertion (a variable
  that no longer exists anywhere in the tree, previously masked by the failure
  above it) is repaired to `TENANT_ID` / `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` —
  which is the criterion's actual class ("the configuration its deployed form
  needs"), and `TENANT_ID` is precisely the omission that reproduces the
  service-unavailable failure the criterion is named for. The synthetic `shipped`
  fixture still uses `BUILDER_ORIGIN`, correctly: that is the historical
  configuration the check must catch.
- **AC-1336** — `not.toContain('skip  ')`, which contradicted its own criterion,
  is gone. The replacement is **stronger**, not weaker: each control-surface
  check must be named as skipped, must not be reported as a pass, the skip-line
  count must be exactly two (so a skip creeping into the applicable set cannot
  pass by being counted rather than named), and the summary must read `9 passed,
  2 skipped`. That is what AC-1336 says — *"A passing run is **not** required to
  have skipped nothing... What the run must do is **name** what it skipped."*
- **AC-1337 / AC-1338** — the nine-check pin is replaced by `PUBLIC_CHECKS` +
  `CONTROL_CHECKS` → `ALL_CHECKS`, matching the eleven checks AC-1425 produced.
  AC-1338 additionally asserts the control-surface skips name **their own**
  missing option rather than `--slug`, which is the criterion's actual claim.
- **AC-1342** — the prose assertions that failed are replaced by **running the
  real hook**. `runSecretHook` executes `bin/deploy.d/secrets/10-anthropic-api-key`
  with `npx` (wrangler) replaced by a recorder — the external boundary and the
  only thing stubbed. It asserts the composed command line carries the name and
  environment and never the value, that the value arrives on stdin with **no
  trailing newline** (captured raw to a file, because a shell substitution would
  strip the thing under test), that neither path echoes the value, and that the
  rehearsal uploads nothing. This is a genuine upgrade from source/prose
  inspection to observed behaviour.
- **AC-1055 (the review's secondary finding)** — the streaming-origin half is now
  asserted. `test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion`
  drives all four unresolvable identifier shapes against workerd with real D1 and
  R2: still 200 + `text/event-stream`, carries the origin's own message, carries
  nothing of the assistant's with the model **armed and recording zero requests**
  (so the refusal genuinely arrived ahead of anything streamed), ends with
  exactly one completion frame in last position, and adds no transcript object —
  asserted as a delta against a pre-refusal listing rather than as an empty
  prefix, which is correct for a shared bucket.

The fix commit (`f15b4956db`) touches **only** `tests/` — no runtime code
changed, as reconciliation requires.

### What I executed, and what I could not

Stated plainly, because it bounds this verdict.

**Executed and passing:**
- `reconciliation-platform-build-deploy-smoke.test.ts` → 12 passed, 1 failed
  (AC-1331 only — see below).
- `reconciliation-platform-invocation-log-retention.test.ts` +
  `reconciliation-builder-private-access-gate.test.ts` → **12 passed** (AC-1454,
  AC-1455, AC-1376 and the gate's criteria).
- The remaining node-side files carrying these stories' ACs
  (`assistant-conversation-artifact`, `assistant-conversation-knowledge`,
  `builder-request-time-render`, `builder-toolbar-lifetime`,
  `builder-workspace-chrome`, `builder-workspace-mounted`,
  `cloudflare-site-store`, `component-resolution-anchor`, `workspace-boot-guard`,
  `workspace-transport`, `bug32-webui-scope-rebrand`) → **29 passed, 7 failed**.

**Could not execute — sandbox, not code.** This sandbox denies socket binding.
Every one of the 7 failures above is `Error: listen EPERM: operation not
permitted` raised from `startBuilder` or from a test's own stub origin, in files
this bundle did not touch. The same denial kills the whole `workers` project
before a single test runs (miniflare: `listen EPERM 127.0.0.1`), so
`reconciliation-cloudflare-site-store.workers`,
`reconciliation-cloudflare-store-draft-reuse.workers`,
`reconciliation-workspace-tenant-bootstrap.workers`,
`reconciliation-workspace-edge-origin.workers`,
`reconciliation-assistant-conversation-continuity.workers` and
`reconciliation-builder-private-access-automation` were unrunnable here. That
covers AC-1387, AC-1447, AC-1448, AC-1449, AC-965, AC-1402, AC-1055, AC-1456 and
AC-1450–AC-1453.

For those I verified sufficiency by reading each UAT against its criterion and
against the landed code path, as the two previous reviews did, and each holds:
AC-1449 and AC-965 drive the Worker's own `fetch` against a real D1 with a
per-case tenant id (the file is shared and the bootstrap is a write, so a shared
id would let case order decide the property under test); AC-1447 asserts reuse by
**object identity**, which is the only observation at the store boundary that
distinguishes reuse from re-validation, since `assembleSite` builds a fresh
object per call and a timing assertion would be flaky by construction; AC-1448
covers the drop-and-recreate misattribution hazard and the two-account case;
AC-1453 drives the real `bin/access-token` against a local stub management API
and asserts the requests made, with "persists no secret" as a filesystem
observation. No UAT in this set mocks repository-owned code — the only doubles
are the model client, `npx`/wrangler, and the Cloudflare management API, all
external boundaries.

### Excluded as environment artifacts, not defects

- `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight`
  fails with `@lagrangefoundry/webui-shell is not installed`. That package
  resolves only from the main checkout, never from a worktree. Failing a
  reconciliation on it would send the fix loop after an environment.
- The 7 `listen EPERM` failures above, for the same reason.

Neither is caused by, or touched by, this bundle.

## Judgment Calls

- **AC-1336's assertion changed shape and I checked it did not weaken.** Removing
  `not.toContain('skip  ')` looks like a relaxation. It is not: the criterion was
  rewritten (by an earlier, operator-argued Reconciliation Decision) to require
  skips be *named* rather than absent, and the replacement pins the exact skip
  set, forbids a skip being reported as a pass, and caps the skip-line count at
  two. A skip drifting into the applicable set now fails where before it could
  only fail if it also printed the literal `skip  `.
- **AC-1341's real-tree assertion moved from `BUILDER_ORIGIN` to `TENANT_ID`.**
  Re-pointing a failing assertion is normally the weak fix. Here the old variable
  does not exist anywhere in the tree, the criterion names a *class* rather than
  a variable, and the replacement is the omission that reproduces the exact
  failure the criterion is named for. Accepted.
- **The `ACCESS_DEV_OPEN` exemption lives in test-support code.** `missingFromEnv`
  is the check AC-1341 describes, and the criterion explicitly requires the
  exception be "named in the check itself rather than left as a gap in the
  report". A named constant rather than a predicate is the right shape for
  "one variable only".
- **The version bump generating no story is correct.** A story there would
  document bookkeeping.
- **The five `test_UAT_FC_BUG-3x_*` files still on disk are not this review's
  gate.** They duplicate the reconciled `reconciliation-*` coverage;
  `check_fc_orphans` owns them.
- **Step 5b was scoped to every active criterion on all five stories**, not only
  to the ones this bundle touched — which is how AC-1336/1337/1338/1342 were
  caught last round. That sweep is clean this round within what this sandbox can
  run.

## Verdict

PASS.

Stories accurately and completely document the behaviour surface. A developer
reading these five stories would have a correct mental model of what the operator
intended to build — including both deliberate reversals (AC-965, AC-1055), all
three deliberate non-changes recorded as Reconciliation Decisions, and the
intent-silent properties formalized as decisions rather than as unattributed
claims. All five plan items produced output. Every one of the 107 active criteria
across these stories has a covering UAT, and the five criteria that lacked
*passing* evidence last round now pass when the file is actually run.

The residual limit on this verdict, stated so it is not mistaken for coverage:
the workerd suites and every test that starts an HTTP origin cannot execute in
this sandbox (`listen EPERM`). Their sufficiency was established by reading each
UAT against its criterion and its code path, not by execution.
