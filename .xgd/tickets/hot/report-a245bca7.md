---
uid: report-a245bca7
id: REPORT-2510
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 18'
created_by: xgd
created_at: '2026-08-20T19:29:23.212069+00:00'
updated_at: '2026-08-20T19:29:23.212069+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 5
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 18
**Fixes applied this call**: 0
**Violations remaining**: 5 (+3 warnings, 1 needs_review)
**Needs more work**: true — but **not by this loop**. See "Declaration" below.

## Declaration

`progress_made=false`, `needs_more_work=true` — deliberately, to trigger the
loop's designed stuck-exit and hand control to the operator.

This is the fifteenth consecutive `progress_made=false`. I did not inherit that
conclusion: **I re-derived the blocking condition from source in this call**, and
it holds. The eight actionable findings are not deferred on their merits — every
one of them is correct and I dispute none. They are deferred because **the files
they edit do not exist on this branch**.

## Re-verification performed this call (not carried forward on trust)

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse HEAD` | `1950bc7c4` — advanced from `c5923077a`; ticket/report/workflow commits only |
| main | `git rev-parse main` | `bda6c9939` — **unchanged across all eighteen passes** |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba` — the regression cut point; `main` is **not** an ancestor of HEAD |
| store modules @ HEAD | `git ls-tree --name-only HEAD -- tools/generate/src/store/` | 8: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | same, `main` | 14 — the same **plus** `assemble, fs-store, journal, journal-model, memory-store, site-store` |
| port tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` | **no** `reconciliation-site-storage-port*`, **no** `*.workers.test.ts`, **no** `test_UAT_FC_REQ-141_*` / `REQ-142_*` |
| port tests @ main | same, `main` | `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |
| fixture helpers @ HEAD | `git ls-tree -r --name-only HEAD -- tests/support` | **only** `webui-installed.ts` |
| fixture helpers @ main | same, `main` | `builder-origin.ts`, `site-factory.ts`, `webui-installed.ts`, `wrangler-toml.ts` |
| `main` worktree | `git worktree list` | **present** at `/Users/martin/.xgd/worktrees/…/main` → `bda6c9939` |

Nothing has changed since attempt 17 except this loop's own ticket/report commits.

## Why zero mutations — the four available levers, and why each is wrong

Every one of findings 1–8 is `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts` or `…workers.test.ts`.
Confirmed above: neither exists at HEAD.

| Lever | Why rejected |
|---|---|
| **Author the tests here** | They would import six store modules (`site-store`, `memory-store`, `fs-store`, `assemble`, `journal`, `journal-model`) and two fixture helpers (`tests/support/site-factory.ts`, `tests/support/wrangler-toml.ts`) that are **absent at HEAD** — verified this call. The suite fails **at collection**, on the branch whose sole purpose is to gate a fast-forward of `xgd-stable`. Red against *correct* code is worse than absent. |
| **Author them with a skip guard** | Manufactures a green-but-vacuous test that falsely reports coverage. Strictly worse than nothing. |
| **Write to the `main` worktree** | An unscoped cross-branch commit, outside this scope path (`…/cap/capability-c4c7a854/5/1`) and unreviewed. Not this loop's to make. |
| **Set `uat_coverage`** | Owned by `check`/`fix_uat_coverage`, not this loop. Setting it here would manufacture the appearance of progress without a test existing. |
| **`ac-edit` the ACs to fit the missing tests** | Inverts the source of truth. The ACs are right; the *branch* is behind. |

The fix side has no lever it has not already tried and correctly rejected.

## Root cause, stated once for the operator

The port landed on `main` at `2b902ead0` (2026-08-20T12:21:02Z, merged
`b18b859d7` at 12:49:19Z) — **11h38m after** regression `cb0dad9c` was cut at
`0f44ef1ba` (2026-08-20T00:43:02Z).

The ACs resolve from the **global ticket store**; the tests resolve from the
**branch**. So the *check* is sound here and its five violations are real — but
the *repair* has nowhere to land. This is a branch-geometry problem, not a
matrix problem, and no number of further fix iterations can change it.

## Operator decision required (finding 9 — unanswered since attempt 7)

**(c) — recommended.** Run `check_uat_validation` + `fix_uat_validation` for
`capability-c4c7a854` on a branch at or past `b18b859d7`. The `main` worktree
already exists at `bda6c9939` (verified this call), so this needs **no new
branch and no resync**. All eight findings become immediately actionable there.

**(b) — acceptable fallback.** Scope `capability-c4c7a854` out of regression
`cb0dad9c`. Note this only relocates the repair; the check's result stands.

**(a) — least attractive.** Resync `regression-cb0dad9c` past `b18b859d7`. Makes
the findings actionable here but changes what the regression is testing mid-run.

## Ordering for whoever picks this up (unchanged, still correct)

1. **Finding 4** first — a deletion (`…test.ts:585-590` plus the `'Before'`
   scaffolding at `:563`/`:571`). Leaving it keeps CAP-85's freshness evidence
   duplicated inside CAP-101's, which is an exclusivity breach as well as a
   consistency one.
2. **Findings 3 and 5** — extensions to existing tests.
3. **Findings 1 and 2** — new tests, the larger authoring jobs.
4. **Warnings 6–8** — cheap once their host tests are open; 6 is cheaper than it
   looks, since the binding-names half of AC-1328 bullet 4 is already in place.

## Process signal the operator should see

The inner loop's `progress_made=false` is being consumed by the outer
`fix_uat_validation` → `check_uat_validation` cycle **without escalating**, which
is why eighteen identical passes have run. Every comment on the report chain is
`created_by: xgd` — I checked this call; **no operator reply has ever arrived**.

Fifteen consecutive `progress_made=false` fix reports is a **terminal** signal,
not another `@fail` to retry. Per the project's failure/error taxonomy this is a
*terminal failure* (an expected dead-end requiring a graceful halt), not a
recoverable *failure*. The containing workflow should be halting here, not
re-invoking. A nineteenth iteration against this tree will reproduce this report
verbatim.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | **None.** All 8 actionable findings are gated by needs_review finding 9. Re-verification performed and recorded above. |

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (repair of findings 1–8) | All eight repairs target test files that exist only on `main`; the regression branch was cut 11h38m before the code landed | Choose (c) run the uat loop on the existing `main` worktree at `bda6c9939` [recommended], (b) scope the capability out of regression `cb0dad9c`, or (a) resync the regression branch past `b18b859d7` |
