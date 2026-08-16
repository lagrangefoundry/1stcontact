---
uid: comment-27a83ebd
id: COMMENT-1036
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-16T01:17:24.178669+00:00'
updated_at: '2026-08-16T01:17:24.178669+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e517c98c
  kind: note
---

**Attempt 1 complete — 2 mutations applied, 1 violation remains and is blocked on a permission.** Report: `REPORT-2039` (`report-e517c98c`), `needs_more_work: false`, `violations_remaining: 1`.

## Applied

| Category | Element | What changed |
|---|---|---|
| ac-edit | AC-1099 | Extended with the caller-supplied-presentation path (finding 2), taking the report's first option. Criterion now covers: a supplied presentation is what the instance mounts, contract-checked like any other, reaching the render, and the only route by which a kind with no default look is instantiated. Title widened; the config-only path and the no-default-look refusal preserved verbatim. |
| uat-edit | `tests/reconciliation-beyond-l1-authoring.test.ts:363` | `test_UAT_AC1099_…` now adds a `carousel` with `--slots` through the real `1c` argv entry point, asserts the stored seams hold the *supplied* subtrees (not a derived default), and that the slide copy reaches `index.html`. |

Verified green: the new assertions ran verbatim as a scratch test in the same describe block — **passed, 6459 ms** — then the scratch was removed.

## Blocked — finding 1, the only violation

Its category is `ac-add`, and **`xgd ticket create` is denied in this session** (`--help` alone is denied too, so it's the sub-command, not the arguments). The other sanctioned interface, `xgd_source.core.ticketing.create()`, was denied as well. I stopped there rather than routing around it. `xgd ticket update/get/list`, `xgd report create` and `xgd quality run` are all permitted.

Re-invoking the fix prompt won't change this — hence `needs_more_work: false`. The full AC text (title + Criterion + Verification, scoped to STORY-107 per the assessor's ownership note, not as a widening of AC-1093) is drafted verbatim in the report body, ready to paste once `xgd ticket create` is granted.

## Also found — not mine, and material

The suite is red branch-wide: **74 failed / 1420 passed across 12 files**, identically before and after my edits. `Toolbox.run` returns `[]` where every test here expects the answer string (`TypeError: answer.replace is not a function`). That Toolbox isn't this repo's code — `createL1Toolbox` loads it from the shared `ai` package via `sharedModuleUrl('ai', './core')` (`tools/generate/src/cli/ai/toolbox.ts:96,490`), so it's external dependency drift.

Ten of STORY-107's fifteen UATs fail this way, including `test_UAT_AC1099` itself (at pre-existing line ~326, before anything I added) and the very test the assessor cited as finding 1's shipped evidence. The report's claim that that evidence is "green" holds as of reconciliation but not on this branch today — the `uat` level can't mean much until this is resolved.
