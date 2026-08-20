---
uid: comment-f6e5979a
id: COMMENT-1347
type: comment
title: Comment on capability CAP-101
created_by: xgd
created_at: '2026-08-20T17:26:48.657531+00:00'
updated_at: '2026-08-20T17:26:48.657531+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: capability-c4c7a854
  kind: note
---

## BLOCKED — uat-level validation of CAP-101 cannot converge inside regression `cb0dad9c`

Raised from `fix_structural_validation` attempt 4 (scope
`xgd/structural_validation/report-2485c83c/cap/capability-c4c7a854/5/1`), after four
check/fix passes produced identical findings and **zero** applied fixes
(REPORT-2476, REPORT-2478, REPORT-2480, and this pass).

This comment exists so the decision sits on the capability rather than inside a fifth
nested report. **It resolves no finding.** The blocker needs an operator/workflow choice.

### The cause

The regression run predates the capability it is being asked to validate.

| Event | When | Ref |
|---|---|---|
| Regression `cb0dad9c` anchored | 2026-08-20 **00:43:12** | REPORT-2277 (`report-2485c83c`) |
| Branch cut (merge-base with `main`) | 2026-08-19 17:43 | `0f44ef1ba` |
| STORY-118 created | 2026-08-20 **05:08:58** | `story-3f4a5f2b` |
| BUNDLE-19 landed the port on `main` | 2026-08-20 **05:49** | `b18b859d7` |
| AC-1353 / AC-1354 created *in this worktree* | 2026-08-20 **15:43 / 15:59** | ac-level fix loop |

The run received this capability's **ticket store** without its **code and tests**.

### Independently re-verified this pass (not carried forward on trust)

- `tools/generate/src/store/` in this worktree holds `base / diff / fsutil / history /
  index / loadSite / paths / snapshot`. `main` additionally holds `site-store.ts`,
  `fs-store.ts`, `memory-store.ts`, `assemble.ts`, `journal-model.ts`, `journal.ts` —
  **none present here.**
- `tests/reconciliation-site-storage-port.test.ts` and
  `tests/reconciliation-site-storage-port.workers.test.ts` exist on `main`, **not here**;
  this tree matches exactly one storage test, `req22-storage.test.ts`.
- `git merge-base HEAD main` → `0f44ef1ba`; `main` tip is `bda6c9939`. The port commit is
  not an ancestor of HEAD.
- `git grep -a -o -E "test_UAT_AC13(2|5)[0-9]_[a-z_0-9]*" main -- tests` returns
  AC1320–AC1329 only. **No `test_UAT_AC1353_*` or `test_UAT_AC1354_*` exists anywhere.**
- `git grep -a -E "appendChange|changesSince|pendingChanges" main -- tests` returns
  **nothing** — three of AC-1321's ten questions are asked by no test in the repository.

### All eight actionable findings are executable, just not here

Every seam the eventual fix needs is confirmed present on `main` this pass:

| Seam | Location on `main` |
|---|---|
| `fsSiteStore(` construction sites — exactly three | `cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505` |
| `fsSiteStore` factory | `store/fs-store.ts:45` |
| `memorySiteStore()` factory | `store/memory-store.ts:71` |
| Injectable tool-adapter seam (AC-1354) | `cli/ai/toolbox.ts:176` — `l1Operations(slug, opts: EditOptions)`, exported specifically to be exercised without an AI-runtime import |
| AC-1353's substance, under a free-coded name | `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,115` |

So findings 1–8 are fully specified and de-risked. They are blocked on the *branch*, not
on their merits, and not on any defect in the production code.

### Why no fix loop can apply them here

Authoring `test_UAT_AC1353_*` / `test_UAT_AC1354_*` into this worktree would import
modules that do not exist in it. The suite would fail at collection — a knowingly-red
test file added to the branch whose sole purpose is to gate a fast-forward of
`xgd-stable`, and red against *correct* code. The three prior fix loops declined for this
reason and were right to.

### Decision needed — one of

- **(b) Scope `capability-c4c7a854` out of regression `cb0dad9c`.** It postdates the run's
  own anchor by 4h25m and cannot pass at `level=uat` against a tree that predates it.
  *No CLI affordance exists for this* — `xgd regression` offers only
  `run/status/stop/clean`, and the anchor report carries no editable capability list, so
  this is a workflow-level action, not a ticket edit.
- **(c) Run `check_uat_validation` + `fix_uat_validation` for this capability on a branch
  containing the port** (i.e. at or past `b18b859d7`), where all eight findings are both
  actionable and runnable.
- **(a) Resync `regression-cb0dad9c` past `b18b859d7`.** Makes them actionable here but
  changes what the regression is testing mid-run.

**(b) or (c) recommended.** (a) is least attractive given the anchor-time evidence.

A fifth iteration against this tree will reproduce this report unchanged.
