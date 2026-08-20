---
uid: report-7e6e7f18
id: REPORT-2496
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 11'
created_by: xgd
created_at: '2026-08-20T18:33:20.225460+00:00'
updated_at: '2026-08-20T18:33:20.225460+00:00'
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

**Attempt**: 11
**Fixes applied this call**: 0
**Violations remaining**: 5 (+3 warnings, 1 needs_review)
**Needs more work**: true
**Progress made**: false — every actionable finding is blocked by finding 9, which remains unanswered after eleven passes.

## Why zero mutations, again — re-derived from source this call

I did not carry REPORT-c1928d4e forward on trust. Every load-bearing claim was
re-established independently in this worktree this call:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse HEAD` | `562cace5c` (advanced from `2e157d1d5`) |
| main | `git rev-parse main` | `bda6c9939` — unchanged across all eleven passes |
| mutation since attempt 10 | `git diff --stat bcdfd129d HEAD` | **six ticket files only**, 588 insertions. No source, no tests |
| store modules @ HEAD | `ls tools/generate/src/store` | `base, diff, fsutil, history, index, loadSite, paths, snapshot` (8) |
| store modules @ main | `git ls-tree -r --name-only main` | the same **plus** `assemble, fs-store, journal-model, journal, memory-store, site-store` (14) |
| port tests @ HEAD | `ls tests` | absent — FC files stop at `REQ-138`; no `reconciliation-site-storage-port*`, no `*.workers.test.ts`, no `REQ-14x` |
| port tests @ main | `git ls-tree -r --name-only main -- tests` | `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts` |
| AC-1353 prohibitions @ HEAD | `git grep -a -n -E "^import .*(node:fs\|node:path\|\.\./store)" HEAD -- tools/generate/src/cli/edit.ts` | `:1 node:fs`, `:2 node:path`, `:24 ../store` — all three genuinely **false** here |
| operator response | `xgd ticket comments capability-c4c7a854` | COMMENT-1347, COMMENT-1354 — both assistant-authored, still no reply |

**The timing, confirmed by commit date rather than inference:**

- regression `cb0dad9c` cut at `0f44ef1ba` — `2026-08-19T17:43:02-07:00`
- the port landed on `main` at `b18b859d7` — `2026-08-20T05:49:19-07:00`

The code under validation post-dates this branch by **12h06m**. That is the whole
of the problem, and it is not a repairable defect in the matrix.

## Every finding is test-side, and the tests have nowhere to land

All eight actionable findings (1–8) are `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts` and `…workers.test.ts`. Neither
file exists at HEAD. The assessor raised **no** `code-issue`, deliberately —
every claim the ACs make is reachable only from code that exists on `main`.

Authoring them here would import six modules absent at HEAD (`site-store.ts`,
`memory-store.ts`, `fs-store.ts`, `assemble.ts`, `journal.ts`,
`journal-model.ts`) and fail at collection — adding a knowingly-red suite to the
branch whose sole purpose is to gate a fast-forward of `xgd-stable`. Red against
*correct* code.

AC-1353 is the sharpest illustration: its first bullet requires `edit.ts` to be
free of `node:fs`, `node:path` and `../store`. At HEAD `edit.ts` imports all
three, at lines 1, 2 and 24. A faithful `test_UAT_AC1353_*` written here would
not be a flaky or scaffolding failure — it would correctly report that this tree
predates the port.

## Levers considered and rejected (unchanged from attempts 4–10)

| Lever | Why not |
|---|---|
| Author the tests here | Red at collection; poisons the `xgd-stable` gate |
| Write into the `main` worktree (`bda6c9939`, live per `git worktree list`) | Unscoped cross-branch change — uncommitted, unreviewed, invisible to this workflow's verification, and outside scope path `…/cap/capability-c4c7a854/5/1` |
| Set `uat_coverage` | Field is owned by `check`/`fix_uat_coverage`, not this loop. Setting it would manufacture progress, not make it |
| `ac-edit` the ACs to fit the missing tests | Inverts the source of truth — the assessor's ledger is explicit that the ACs are sound and the tests are the lagging side |
| Add a third escalation comment | Two identical ones sit unanswered. A third is noise, and counting it as `fixes_applied` would be inflating the number |

I declined the last one specifically because it is the tempting way to report
`progress_made=true` without having made any. `fixes_applied: 0` is the honest
number.

## Code Edits

None this call. None are warranted — no finding is categorized `code-issue`, and
the production code on `main` already satisfies every AC claim the assessor checked.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (finding 9) | All eight repairs target test files that exist only on `main`; the *check* is sound on this branch but the *repair* has nowhere to land | Choose (a), (b) or (c) below |

**Newly verified this call, and it makes (c) turnkey:** `git worktree list`
confirms a live worktree at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/main`,
checked out at `main` = `bda6c9939`, which already contains all six store modules
and all five port test files.

- **(c) — recommended.** Run `check_uat_validation` + `fix_uat_validation` for
  `capability-c4c7a854` against the existing `main` worktree. Needs no new
  branch, no resync, and no change to what regression `cb0dad9c` is testing.
  Ordering once unblocked, per the assessor: finding 4 first (a deletion —
  leaving it in keeps CAP-85's evidence duplicated inside CAP-101's), then 3 and
  5 (extensions to existing tests), then 1 and 2 (new tests, the larger jobs).
  Warnings 6–8 are cheap once their host tests are open.
- **(b)** Scope `capability-c4c7a854` out of regression `cb0dad9c`. Note this
  only relocates the repair — the check is runnable here and its result is sound.
- **(a)** Resync `regression-cb0dad9c` past `b18b859d7`. Makes the findings
  actionable here but changes what the regression is testing mid-run. Least
  attractive.

## Second item for the operator: the loop is not escalating

Distinct from the above and worth attention in its own right. This inner loop has
now returned the stuck signal (`progress_made=false`) on seven consecutive
passes. The outer `fix_uat_validation` → `check_uat_validation` cycle is
consuming it and re-entering rather than halting, which is why eleven identical
passes have run and produced eleven identical reports.

Per the documented loop semantics, `needs_more_work=true` +
`progress_made=false` should **exit the loop**. It is not doing so. That is a
control-flow bug in the outer cycle, not a workflow outcome — and it is the
reason a deterministic check with unchanged inputs has been re-run ten times at
full cost.

**A twelfth iteration against this tree will reproduce this report verbatim.**
The inputs have not changed: `main` has not moved from `bda6c9939` across any of
the eleven passes, and the only mutation in this worktree since attempt 9 is
ticket files written by these very loops.
