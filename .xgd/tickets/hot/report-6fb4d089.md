---
uid: report-6fb4d089
id: REPORT-2482
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 4'
created_by: xgd
created_at: '2026-08-20T17:27:33.038351+00:00'
updated_at: '2026-08-20T17:27:33.038351+00:00'
completed_at: null
last_field_updated: created_at
result: fail
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

**Attempt**: 4
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings, 1 needs_review)
**Needs more work**: true — but **not by this loop**. See "Loop declaration" below.

## Outcome

Zero findings resolved, for the fourth consecutive pass. This is not deference to the
three prior loops: **every load-bearing claim was independently re-derived from git this
pass**, and all of it holds. The blocker (finding 9, `needs_review`) gates findings 1–8
completely, and the resolution is not available to a fix loop running on this branch.

One concrete ticket mutation was made — an escalation comment on the capability
(COMMENT-1347, `comment-f6e5979a`). **It resolves no finding** and is not counted in
`fixes_applied`. Its purpose is to put the four-pass evidence and the operator decision on
CAP-101 itself rather than inside a fifth nested report.

## Independent verification performed this pass

Not carried forward on trust from REPORT-2475/2477/2479:

| Claim | How re-derived | Result |
|---|---|---|
| Port modules absent here | `ls tools/generate/src/store/` vs `git ls-tree main` | Confirmed — `site-store.ts`, `fs-store.ts`, `memory-store.ts`, `assemble.ts`, `journal-model.ts`, `journal.ts` on `main` only |
| Reconciliation UATs absent here | `git ls-tree main -- tests/` vs local `tests/` | Confirmed — both `reconciliation-site-storage-port*.test.ts` on `main` only; this tree matches one storage test, `req22-storage.test.ts` |
| Branch predates the port | `git merge-base HEAD main` | Confirmed — `0f44ef1ba`; `main` tip `bda6c9939` |
| No `test_UAT_AC1353/1354_*` anywhere | `git grep -a -o -E "test_UAT_AC13(2\|5)[0-9]_…" main -- tests` | Confirmed — AC1320–AC1329 only |
| AC-1321's three unasked verbs | `git grep -a -E "appendChange\|changesSince\|pendingChanges" main -- tests` | Confirmed — **zero** hits |

Text-mode grep (`-a`) used throughout per STORY-118's survey hazard (`builder.ts` /
`fidelity.ts` carry NUL bytes; a plain recursive grep skips them silently).

**Seams for the eventual fix — all confirmed live on `main` this pass**, so findings 1–8
are de-risked rather than merely deferred:

| Seam | Location |
|---|---|
| `fsSiteStore(` sites — exactly three, as AC-1354 requires | `cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505` |
| `fsSiteStore` / `memorySiteStore` factories | `store/fs-store.ts:45`, `store/memory-store.ts:71` |
| AC-1354's injectable seam | `cli/ai/toolbox.ts:176` — `l1Operations(slug, opts: EditOptions)`, exported to be exercised without an AI-runtime import |
| AC-1353's substance under an FC name | `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,115` |

## Why findings 1–8 were not applied

All eight are `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts`, which **does not exist in this
worktree**. Authoring them here would import modules absent from this tree; the file would
fail at collection, adding a knowingly-red suite to the branch whose sole purpose is to
gate a fast-forward of `xgd-stable` — red against *correct* code
(`HEAD:tools/generate/src/cli/edit.ts:1` is `import { copyFileSync, writeFileSync } from
'node:fs'`, so AC-1353's first bullet is *false* here, not merely unevidenced).

No matrix-side substitute exists either, and I checked rather than assumed:

- **No `uat_coverage` bookkeeping to correct.** All 11 ACs under STORY-118 carry only
  `story_uid`, `kind`, `regression_only` — no `uat_coverage` field is set on any of them,
  so there is no stale `pass` to demote.
- **Deprecation would contradict the assessor.** AC-1353/AC-1354 are categorized
  `uat-add`, not `ac-deprecate`; the prompt forbids falling back to deprecate.
- **No scope-out affordance.** `xgd regression` exposes only `run/status/stop/clean`, and
  the anchor report (REPORT-2277) carries no editable capability list, so option (b) is a
  workflow action, not a ticket edit.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | escalation (non-resolving) | `capability-c4c7a854` | Added COMMENT-1347 recording the four-pass evidence, the confirmed seams, and the three operator options on the capability ticket |

## Code Edits

None this call. No `code-issue` was raised by the assessor, and none was found: every
claim the ACs make is reachable from code that already exists on `main`.

Re-confirmed the assessor's recorded near-miss so it is not re-derived as a bug:
`createL1Toolbox` (`main:cli/ai/toolbox.ts:505`) spreads `opts` then overrides
`store: fsSiteStore(ctxOf(opts))`, discarding an injected store. That is what AC-1354
*requires* — the toolbox naming the filesystem adapter once, at start-up, on the
operator's machine. The injectable seam is one level down, at `toolbox.ts:176`.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (whole uat level) | The capability postdates the regression's own anchor by 4h25m: run anchored 2026-08-20 00:43:12 (REPORT-2277), branch cut `0f44ef1ba` 2026-08-19 17:43, BUNDLE-19 landed the port at `b18b859d7` 05:49, AC-1353/1354 created in this worktree 15:43/15:59. The run received the ticket store without the code and tests. | Choose one: **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c`; **(c)** run `check_uat_validation` + `fix_uat_validation` for it on a branch at or past `b18b859d7`, where all eight findings are runnable; **(a)** resync `regression-cb0dad9c` past `b18b859d7`, which changes what the regression tests mid-run. **(b) or (c) recommended.** |

## Loop declaration

`needs_more_work=true, progress_made=false` — the sanctioned "blocked entirely by
needs_review" exit. Findings 1–8 are not labelled `needs_review` individually, but each is
strictly downstream of finding 9 and none can be executed on this branch. Declaring
`progress_made=true` on the strength of an escalation comment would earn a fifth
invocation that would reproduce this report verbatim; that would be dishonest about the
validation state and would extend the thrash rather than end it.

**Ordering when unblocked** (from the assessor, seams verified above): finding 4 first (a
deletion — it keeps CAP-85's evidence out of CAP-101's set), then 3 and 5 (extensions to
existing tests), then 1 and 2 (new tests). Warnings 6–8 are cheap once their host tests
are open.
