---
uid: report-d317f738
id: REPORT-6882
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-30T19:03:23.133701+00:00'
updated_at: '2026-10-30T19:03:23.133701+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-e15a19ef
  parent_report_uid: report-a131ae1f
  batch_index: '0'
---

I made no edits: nothing in this batch needed a test, AC, story or code change. All 15 failures came from one environmental cause, which is now resolved.

**What went wrong.** The scoped quality run (REPORT-6880, 11:58) started on a worktree where `apps/control-app/src/generated/` didn't exist yet. Those files are gitignored and only created by `1c assets`. `apps/control-app/src/ai.ts` imports `./generated/ai-workers.js`, so:
- **The 13 "orphaned" ACs** (656–659, 720, 738, 1013–1017, 1415, 1790): four test files (aligned-crops sandbox routing, CLI output hygiene, crop offline verb, install preflight) failed on import with `Cannot find module './generated/ai-workers.js'`. None of their tests ran, so those ACs had no evidence.
- **The AC738 and AC1415 failures:** the real `1c` binary loads the CLI barrel, which reaches `ai.ts`, so `1c help`, `1c list` and the AC1415 boot check exited 1.

The AC1417 test in the same run calls `1c assets`, which wrote the generated files at 11:59, after the run had already failed.

**Now.** The generated files exist and all 7 test files for this story pass: 24 passed, 1 skipped. The skipped test is `test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs`. It is gated with `it.runIf(browserOk)`, a gate the test already had, and no browser is available in this environment. AC720's other test, the routing check, passes.

**It will happen again on any fresh checkout or worktree.** Nothing in the test setup runs `1c assets` before the suites. The fix would be a Vitest `globalSetup` that runs it, or a pre-test step in the quality runner. I left that alone because it changes test setup shared with tests outside this batch.

**Help text still out of date.** The story records that the CLI help text still lists `crop` and `serve` in the install-preflight paragraph. That's for `fix_uat_coverage`, and changing it would touch frozen code.

```yaml
## Assessment
status: resolved_environmental
edits: none
root_cause: "apps/control-app/src/generated/* (gitignored, produced by `1c assets`) was absent when the scoped quality run started; ai.ts import of ./generated/ai-workers.js failed, causing 4 test files to fail at import (13 orphan ACs) and the 1c binary to exit 1 (AC738, AC1415)."
evidence: "REPORT-6880 vitest JSON shows 'Cannot find module ./generated/ai-workers.js' for 4 files and the Vite SSR load error in AC1415; generated files timestamped 11:59 after the 11:58 run; re-run of all 7 story test files now: 7 files passed, 24 tests passed, 1 runIf(browserOk) skip that was already in the test."
recommendation: "Add a Vitest globalSetup (or quality pre-step) that runs `1c assets` so fresh worktrees don't hit this again — a shared-infra change outside this batch's scope."
```
