---
uid: report-35d8aa75
id: REPORT-3667
type: report
title: Fix Platform Build, Deploy & Live-Origin Verification (ac) — attempt 1
created_by: xgd
created_at: '2026-09-10T05:03:07.030641+00:00'
updated_at: '2026-09-10T05:03:07.030641+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-5d07b533
  level: ac
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Platform Build, Deploy & Live-Origin Verification (ac)

**Attempt**: 1
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

The report carried exactly one violation (finding #1, AC-1455, `ac-edit`) plus its named
consequential `uat-edit`. Findings #2 and #3 are `info` with resolution category `—` and were
deliberately not acted on. Both were applied in this call so the matrix and its evidence are
consistent at the call boundary.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1455 (`acceptance_criterion-9287f523`) | Rewrote the **Verification** section from a frozen three-binding enumeration into the durable property: neither binding set contains any entry derived from the retention declaration; the named production environment's binding set is **identical to the top level's**; both are non-empty so the assertion cannot be vacuously satisfied. Added the explicit reason the identity is stated as a set relation rather than a snapshot, and the pointer that *which* bindings must be present is AC-1341's to state. The **Criterion** section is preserved verbatim except for one word: "the criteria that assert **an exact set of** bindings" → "the criteria that assert **the** binding set", so the criterion no longer describes its own verification in the shape that just failed. |
| 2 | uat-edit | `tests/reconciliation-platform-invocation-log-retention.test.ts:184-196` | Replaced `const EXPECTED = ['assets:ASSETS', 'd1_databases:DB', 'r2_buckets:SITES']` and its two `toEqual(EXPECTED)` assertions with the set-equality form: non-empty top-level binding set, and `productionBindings` deep-equal to `topLevelBindings`. Comment records why a frozen list is the wrong shape here. The retention-exclusion assertions above (former lines 175–182) and the `missingFromEnv` and negative-control assertions below were kept untouched, as the report directed. |

**Deliberately not edited**: AC-1341 (`ac-edit` was not requested for it, and the report explicitly
warns against editing the pair together — the environment-repetition rule passes on the current
tree, since `BLOBS` and `BROWSER` are each declared at the top level *and* repeated under
`[env.production]`). `uat_coverage` on AC-1455 was also left alone: that field is owned by the
uat-coverage check/fix, not by structural validation.

## Verification

| Command | Result |
|---|---|
| `npm test -- tests/reconciliation-platform-invocation-log-retention.test.ts` (before edit) | 1 failed, 1 passed — `test_UAT_AC1455_…` failed exactly as the report predicted: `expected [ 'assets:ASSETS', …(4) ] to deeply equal [ 'assets:ASSETS', …(2) ]`, received `browser:BROWSER` and `r2_buckets:BLOBS` extra. |
| `npm test -- tests/reconciliation-platform-invocation-log-retention.test.ts` (after edit) | **2 passed (2)** |
| `npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts tests/reconciliation-platform-build-order-and-private-surface.test.ts` | 15 passed, 1 failed — `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight` fails with `@lagrangefoundry/webui-shell is not installed`. |

The AC-1331 failure is **pre-existing and environmental**, not caused by this call and not matrix
drift: the shared component store is populated out of band and is absent in this worktree. The
anchor report already recorded it under "One test in this story's evidence set fails for an
environment reason, not a matrix reason", and it is the precise condition AC-1330's preflight
exists to name. I confirmed the failure message rather than assuming it.

## Why the shape change rather than widening the list to five

The report's Notes were explicit that extending `EXPECTED` to five entries leaves the same trap
armed for the next binding. The failure mode AC-1455 warns about — *"the criteria that assert an
exact set of bindings … would begin failing on a declaration that binds nothing"* — occurred from
the opposite direction: two genuine bindings (REQ-154's `BROWSER`, REQ-162's `BLOBS`) correctly
counted against a list written before they existed. The set-identity form is invariant under any
future binding an unrelated intent adds, while still failing if the two levels ever diverge or the
reader goes blind. Retention's invisibility itself remains proven by the exclusion assertions and
the `a_binding_kind_nobody_has_written_yet` negative control, both untouched — note that set
identity alone would *not* catch a miscounted `[observability]`, since it appears at both levels,
which is exactly why those assertions had to be kept rather than replaced.

## Code Edits (if any)

None this call. The only file edit was to a UAT test, per the report's named consequential
`uat-edit`. `apps/control-app/wrangler.toml` was read but not modified — its five bindings at both
levels are correct and are what the stale AC text failed to anticipate.

## needs_review Items Forwarded

None. No finding in report-aae57348 was categorized `needs_review`.
