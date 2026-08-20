---
uid: report-033cfadc
id: REPORT-2480
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 3'
created_by: xgd
created_at: '2026-08-20T17:16:59.688083+00:00'
updated_at: '2026-08-20T17:16:59.688083+00:00'
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

**Attempt**: 3
**Fixes applied this call**: 0
**Violations remaining**: 5 (+3 warnings)
**Needs more work**: true (blocked — operator decision required)

## Outcome

Zero fixes applied, for the third consecutive pass, and for the same reason. This is not a
repeat of the previous two reports on trust: the blocking fact was **re-derived from this
branch's own source this pass**, and that re-derivation produced evidence *stronger* than
REPORT-2479 (`report-7b857d56`) had. See "New evidence" below — it closes the one workaround
that previous passes left theoretically open.

## Why no finding was applied

All eight actionable findings (1–8) are `uat-add` / `uat-edit` against files that do not exist
in `regression-cb0dad9c`. Re-verified this pass:

| Check | Result |
|---|---|
| `git merge-base --is-ancestor 2b902ead0 HEAD` (the port's commit) | **false** |
| `git merge-base --is-ancestor b18b859d7 HEAD` (BUNDLE-19 merge) | **false** |
| `git merge-base HEAD main` | `0f44ef1ba` — branch predates the port |
| `main` tip | `bda6c9939` (unchanged since REPORT-2479) |
| `tools/generate/src/store/` at HEAD | `base, diff, fsutil, history, index, loadSite, paths, snapshot` — no `site-store.ts`, `fs-store.ts`, `memory-store.ts`, `assemble.ts`, `journal-model.ts` |
| `tests/` at HEAD | no `reconciliation-site-storage-port.test.ts`, no `*.workers.test.ts`, no `test_UAT_FC_REQ-14{1,2}_*` |
| `git grep -a "fsSiteStore\|memorySiteStore\|SiteStore" HEAD -- tools/generate/src` | **no output** |

Every file findings 1–8 edit or extend is absent. The two new tests findings 1 and 2 prescribe
would import seams (`memorySiteStore` at `store/memory-store.ts`, an injectable `store` option
on `l1Operations`) that this branch does not have.

## New evidence this pass — the workaround is closed, not merely unattractive

Previous passes established that the tests are *missing* here. This pass establishes something
stronger: **the behaviour the ACs assert is not present in this tree at all.**

| Branch-side fact | Cited |
|---|---|
| The editing surface is synchronous and filesystem-bound: `import { copyFileSync, writeFileSync } from 'node:fs'` | `HEAD:tools/generate/src/cli/edit.ts:1` |
| `l1Operations` exists here, but with the cwd-based signature — no injectable store: `export function l1Operations(slug: string, opts: GlobalOptions = {}): L1Operations` | `HEAD:tools/generate/src/cli/ai/toolbox.ts:239` (on `main` it is `:176`, post-port) |
| One root vitest config only — no node/workers project split, no workerd project, no wrangler compat parity to assert | `HEAD:vitest.config.mts` (sole match for `vitest` in the tree) |

Consequences, and why they matter more than "the files are missing":

1. **AC-1353's first bullet is false in this tree, not merely unevidenced.** `edit.ts:1` names
   `node:fs` directly. A `test_UAT_AC1353_*` authored here per finding 1 would go **red on
   correct code** — it would be a true assertion about `main` executed against a tree that
   predates it.
2. **Finding 2 is not authorable at all here.** Its prescribed body is
   `l1Operations(slug, { store: memorySiteStore() })`; this branch's `l1Operations` takes
   `GlobalOptions` and there is no `memorySiteStore` to construct.
3. **Findings 5 and 6 target test-runtime configuration that does not exist here.** AC-1328 and
   AC-1329 describe a two-project split routed by filename with real D1/R2 bindings; this branch
   has a single node vitest project.

So "author the tests here anyway and let them fail" is not a conservative fallback — it would
add a knowingly-red suite to a regression branch whose purpose is to gate a fast-forward of
`xgd-stable`. It is ruled out on the merits, not on effort.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | None. No mutation was available that would leave the matrix in a more valid state. |

Explicitly **not** done, and why:

- **Not deprecated AC-1353 / AC-1354.** Both are correct intent for this capability; they are
  unevidenceable *on this branch only*. Deprecating them to clear a coverage gap would falsify
  the matrix and destroy intent the ac-level loop correctly added.
- **Not set `uat_coverage` on any AC.** That field is the assessor's bookkeeping; writing it
  here would assert evidence that does not exist.
- **Not pre-authored the eight test bodies as a ready-to-apply artifact.** Considered and
  rejected: unrunnable test code cannot be verified in this turn, and if the operator picks
  option (b) it is discarded entirely. Under (a) or (c) the fix loop can author *and run* them
  properly, which is strictly better than a hand-carried patch.

## Code Edits (if any)

None this call. No `code-issue` was raised by the assessor, and none is warranted: every claim
the ACs make is satisfied by code that already exists on `main`.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (whole level, finding 9) | The regression received this capability's **ticket store** without its **code and tests**; `main` is 487 commits ahead and this branch is not its descendant. AC-1353/AC-1354 were created *in this worktree* (2026-08-20 15:43 / 15:59) against modules that do not exist here | Choose (a), (b) or (c) below. No fix-loop iteration can resolve this. |

**Options, with this pass's recommendation:**

- **(b) Scope `capability-c4c7a854` out of regression `cb0dad9c` — recommended for this run.**
  Per the branch topology, a regression branch is cut from `main` and gates a fast-forward of
  `xgd-stable`. This capability's code landed on `main` at `b18b859d7` (2026-08-20 05:49),
  *after* this branch's cut at `0f44ef1ba` (2026-08-19 17:43). It is therefore not part of what
  this regression run is validating, and cannot be made so without changing what is under test.
- **(c) Run `check_uat_validation` + `fix_uat_validation` on a branch containing the port.**
  Substantive, and it happens naturally on the next regression cut from a `main` that contains
  `b18b859d7`. Complements (b) rather than competing with it.
- **(a) Resync `regression-cb0dad9c` past `b18b859d7`, then re-enter the fix loop.** Makes all
  eight findings actionable *and runnable* here, but pulls 487 commits of `main` into a branch
  carrying 651 of its own, mid-regression — it changes the tree under regression test. Highest
  cost, and the fix loop's own findings do not require it.

## Loop status — please note before re-invoking

This is the **third** pass to terminate with `progress_made=false`, and the assessor predicted
it verbatim: *"A fourth iteration against the same tree will produce this same report again —
the loop cannot converge without the operator decision."* That prediction is now confirmed
against this branch's source rather than against the prior reports.

`progress_made=false` is declared deliberately so the loop **exits** rather than consuming the
remaining 17 of its 20-iteration budget on identical no-ops. Findings 1–8 are not disputed on
their merits and are not deferred by choice — each is correct, each is cheap once the port is
in the tree, and none is authorable here. They are gated, entirely, by finding 9.
