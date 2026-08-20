---
uid: report-f38804f2
id: REPORT-2476
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 1'
created_by: xgd
created_at: '2026-08-20T16:53:24.665728+00:00'
updated_at: '2026-08-20T16:53:24.665728+00:00'
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

**Attempt**: 1
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings)
**Needs more work**: true
**Progress made**: false — **blocked entirely; every finding is `needs_review` on the same
operator decision.**

## Why nothing could be applied

REPORT-cfd653dd categorised all five violations as `uat-add` (2) or `uat-edit` (3), and all
three warnings as `uat-edit`. **Every file those categories name is absent from the branch this
fix loop runs on.** The assessor flagged this itself ("Environment caveat, repeated because it
bounds every finding"); this call verified it independently and it holds without exception.

### Verified absent from `regression-cb0dad9c` (this worktree, HEAD `5443b7384`)

| What the findings need to edit | Present here? | Present on `main`? |
|---|---|---|
| `tests/reconciliation-site-storage-port.test.ts` (findings 3, 4, 5, 7) | **no** | yes — carries `test_UAT_AC1321…AC1327`, `AC1329` at lines 126/197/257/338/422/460/561/595 |
| `tests/reconciliation-site-storage-port.workers.test.ts` (finding 6) | **no** | yes |
| `tests/test_UAT_FC_REQ-141_project_routing.test.ts` (finding 6) | **no** | yes |
| `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` (finding 1) | **no** | yes |
| `tests/support/site-factory.ts` → `makeMemorySite`, `recordingStore`, `SITE_BACKENDS` (every finding's fixture) | **no** — `tests/support/` here holds only `webui-installed.ts` | yes — lines 129 / 182 / 156 |
| `tools/generate/src/store/{site-store,fs-store,memory-store,assemble,journal-model,journal}.ts` (the code under test) | **no** — `store/` here holds only `base/diff/fsutil/history/index/loadSite/paths/snapshot` | yes |

Checked three independent ways: directory listing, `git ls-files`, and
`grep -rl --text -E 'SiteStore|memorySiteStore|fsSiteStore'` over `tools/ tests/ apps/
packages/` (text mode forced per STORY-118's NUL-byte survey hazard). The only hit is
`apps/public-site/src/site-store.ts`, an unrelated public-site serving module, not the
generate-side port.

### Root cause — a branch-point ordering problem, not a matrix defect

| Event | Commit | When |
|---|---|---|
| Regression branch cut (`report-2485c83c`, REPORT-2277 "Regression start: cb0dad9c") | merge-base `0f44ef1ba` | 2026-08-19 17:43 -0700 |
| BUNDLE-19 merged to `main`, landing the port + its UATs | `b18b859d7` | 2026-08-20 05:49 -0700 |
| `main` tip | `bda6c9939` | 2026-08-20 05:57 -0700 |

`main` is 487 commits ahead of this branch and the branch is not an ancestor of `main`.
`capability-c4c7a854` **did not exist at the branch point** (`git cat-file -e
0f44ef1ba:.xgd/tickets/hot/capability-c4c7a854.md` → does not exist) but is present on `main`
and present on disk here. So the regression branch received this capability's **ticket store**
without receiving the **code and tests that implement it**. The capability under validation
describes an implementation that is not in the tree being validated.

This is why the finding pattern is what it is. It is the same single cause the assessor
identified ("One cause, five findings") seen from one commit further out: the AC set advanced
past the frozen UATs *and* the UATs themselves never arrived on this branch.

### Why the edits were not landed on `main` instead

The assessor's note says edits "must land them where `main` has the files". This call
deliberately did not do that:

1. **They would be invisible to the next assessor pass.** The assessor reads `main` through
   `git show` / `git grep` — i.e. committed state. This fix loop's commit machinery operates on
   `regression-cb0dad9c`; nothing here commits to `main`. Test edits left in `main`'s working
   tree would never enter `git show main:…`.
2. **`main`'s worktree is live.** `git -C …/main status --porcelain` shows four untracked
   ticket artifacts mid-flight (`comment-586c6565`, `comment-85641490`, `report-756a55b9`,
   `report-7efa7b65`), and `reconcile-REQ-147` and `resync-db1949d9` are both active worktrees.
   Dropping uncommitted test files into a worktree other processes are committing from risks
   them being swept into an unrelated commit.
3. **Authoring them here instead would be strictly worse.** A `test_UAT_AC1353_*` importing
   `tools/generate/src/store/site-store.ts` cannot resolve in this tree; it would fail at import
   and break the regression suite. That leaves the matrix in a *less* valid state, which the
   editor contract forbids.

Merging `main` into the regression branch would resolve the blocker but is not this loop's call:
it changes what the regression is validating mid-run, and collides with the two reconcile/resync
branches currently in flight.

## Actions Taken — by Resolution Category

None. No ticket body, AC field, test file or source file was mutated this call.

## Code Edits (if any)

None this call. Consistent with the assessor's own conclusion — "No `code-issue` was raised,
deliberately … Nothing observed suggests a code bug; the suggested edits are all test-side."

## needs_review Items Forwarded

All eight findings are blocked on one operator decision. They are listed separately because the
work differs once unblocked, but they unblock together.

| Element | Finding | Assessor category | Blocked on |
|---|---|---|---|
| AC-1353 `acceptance_criterion-003caa07` | 1 (violation, coverage) | `uat-add` | target file `tests/reconciliation-site-storage-port.test.ts` + `test_UAT_FC_REQ-142_site_store_port.test.ts` absent from branch |
| AC-1354 `acceptance_criterion-56798f01` | 2 (violation, coverage) | `uat-add` | same file absent; also needs `cli/ai/toolbox.ts`'s store seam and `makeMemorySite`, both absent |
| AC-1321 `acceptance_criterion-d4cc3712` | 3 (violation, consistency) | `uat-edit` | edit target is `…test.ts:135-143` / `:176-183`, absent |
| AC-1327 `acceptance_criterion-16093733` | 4 (violation, consistency) | `uat-edit` | deletion target is `…test.ts:585-590`, absent |
| AC-1329 `acceptance_criterion-ae2c7f77` | 5 (violation, consistency) | `uat-edit` | edit target is `…test.ts:595-655`, absent |
| AC-1328 `acceptance_criterion-c8728ae8` | 6 (warning, coverage) | `uat-edit` | requires moving assertions between `…test.ts` and its `.workers` sibling; both absent |
| AC-1325 `acceptance_criterion-6a7b61e4` | 7 (warning, coverage) | `uat-edit` | edit target is `applyAndAsk` at `…test.ts:427-440`, absent |
| AC-1321 `acceptance_criterion-d4cc3712` | 8 (warning, consistency) | `uat-edit` | `loadDraft` reported-errors branch; same absent file |

**Operator decision needed — one of:**

- **(a) Resync the regression branch** so `regression-cb0dad9c` contains BUNDLE-19
  (`b18b859d7`), then re-enter this fix loop. All eight findings become directly actionable in
  this worktree and the authored tests can actually be run.
- **(b) Re-scope this capability out of regression `cb0dad9c`.** `capability-c4c7a854` entered
  this regression's matrix without its implementation; validating it against a tree that predates
  it cannot succeed at `level=uat` by construction.
- **(c) Run `check_uat_validation` + `fix_uat_validation` for this capability on a branch that
  contains the port** (`main`, or a branch cut from it after `b18b859d7`), where the edits are
  committable and the suite is runnable.

**(a) or (c) are the substantive fixes; (b) defers.** The assessor's substance is sound and
should be carried forward verbatim once unblocked — nothing in this call disputes any of the
eight findings, and finding 4 in particular (delete `…test.ts:585-590`, the re-imported CAP-85
freshness claim AC-1327 was repaired five times to expel) should be applied first, as the
assessor recommends.

## Loop declaration

`needs_more_work=true, progress_made=false` → the loop exits and the assessor runs. This is the
designed "stuck" path and is being used exactly as intended: every remaining finding is
`needs_review`, blocked on the same operator decision, and no mutation available in this
worktree would leave the matrix more valid than it is now.
