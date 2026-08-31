---
uid: report-4ef87f28
id: REPORT-2933
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-31T13:51:12.809139+00:00'
updated_at: '2026-08-31T13:51:12.809139+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-b3b7c399
---

The diff is exactly the intended change: only the top-level pair emptied, production untouched.

## Issues fixed

**Critical — `ACCESS_DEV_OPEN` unreachable, local builder 401s**

`apps/control-app/wrangler.toml:105-106` — top-level `[vars]` now declares `ACCESS_TEAM_DOMAIN = ""` / `ACCESS_AUD = ""`; `[env.production.vars]` keeps the real identifiers unchanged. `isUnconfiguredLocalDev()` now returns true under `wrangler dev`, so `1c builder` → `localhost:8788` serves; production still verifies every request. `src/index.ts` untouched, as instructed.

**I did not use the prescribed fix (deleting the two keys from `[vars]`).** Deleting them fails two UATs that require the keys *declared* at the top level — `test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to` (`tests/reconciliation-builder-private-access-gate.test.ts:475`) and `test_UAT_FC_REQ-147_access_configuration_is_declared_for_every_environment` (`tests/test_UAT_FC_REQ-147_access_gate.test.ts:142`). Emptying rather than deleting satisfies the review's stated intent and every existing test. Git confirms this is a restoration, not an invention: `6b5761399d` ("config(control-app): wire Cloudflare Access team domain and AUD" — a non-`[FREE-CODED]` config commit) filled *both* blocks; the bundle shipped with the top-level pair empty. The workerd suites already model that shape (`test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts:32-34`).

**Missing assertion added** — `tests/test_UAT_FC_REQ-145_build_artifacts.test.ts:96` `test_UAT_FC_REQ-145_the_dev_access_bypass_is_reachable_from_wrangler_dev`: keys declared but values empty at top level, production still carrying a real 64-hex AUD so it can't pass by being unconfigured everywhere. Comment states why. Needed a values reader (`topLevelVars`, :33) since the shared reader reports key names only.

**Warnings (all fixed, though flagged optional)**
- `apps/control-app/src/access.ts` — `JWKS_REFRESH_FLOOR_MS` (60s) on cache-bypassing refreshes, tracked via a separate `refreshedAt` so an ordinary TTL read can't refill it. A random-`kid` flood collapses to one fetch/isolate/minute; rotation still works (AC-1380 and the REQ-147 rotation UAT both pass).
- `tools/generate/src/index.ts:9` — orphaned `1c deploy` comment replaced with the conformance harness it actually labels.
- `apps/public-site/src/content-type.ts:6` — dead `deploy/r2.ts` reference repointed at `store/content-type.ts`; also corrected the "pinned by a UAT" claim, which is true of `bin/smoke`'s table, not the store's.
- `ai/host.ts:20`, `ai/toolbox.ts:18` — split rationale now cites `node:fs` via `../commands`' filesystem store, with the Astro bundle error noted as the historical trigger REQ-148/150 removed.
- `store/d1r2-store.ts:411` — unsafe asset names partitioned once and `console.warn`ed. Behaviour deliberately unchanged (drop-and-continue is asserted by `reconciliation-cloudflare-site-store.workers.test.ts:479-494`); the drop is now reportable rather than silent.
- `apps/control-app/ACCESS.md` — Configuration section and "What Access does *not* change" corrected: they claimed both values are set at the top level and that the local surface is the deleted Node origin on `:8790`.

## Verification

| Gate | Result |
|---|---|
| `npm run build` (tsc control-app + public-site) | pass |
| `typecheck` on framework / site-schema / tools-generate | pass, no diagnostics |
| 6 affected suites (145, 147, 144, access-gate, site-store, public-site-serving) | **74 passed** |
| Full `npm test` | 1962 passed, 25 failed in 10 files |

The 25 failures are pre-existing and environmental. I verified by `git stash`ing all nine files and re-running the same 10 suites: **32 failed / 48 passed, identical file list, with and without my changes**. Root cause is `MiniflareCoreError [ERR_RUNTIME_FAILURE]: The Workers runtime failed to start` — the sandbox denies socket binding — matching the environmental failures the review itself recorded. None of the 10 files is one I touched.

**Confidence: high** on the critical finding — the defect is closed, a UAT now pins both halves so it cannot recur, and no test regressed. The one residue is that the deviation from the literal fix-it instruction (empty vs. delete) needs to survive re-review; the rationale is recorded in the config comments, the new test's comment, and ACCESS.md. The outstanding gate remains a full `npm test` in an unsandboxed environment, unchanged from the previous review.
