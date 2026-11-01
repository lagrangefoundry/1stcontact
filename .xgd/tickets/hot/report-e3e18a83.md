---
uid: report-e3e18a83
id: REPORT-7529
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T09:12:47.070467+00:00'
updated_at: '2026-11-01T09:12:47.070467+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-c4f329d3
  parent_report_uid: report-c7122f43
  batch_index: '0'
---

No edits were needed. The 17 ACs were reported as orphaned because their test file couldn't load when the quality run started, not because their tests are wrong. All four of this story's test files now pass together: 29 of 29 tests.

**What happened:** every test for AC-1291…AC-1305, AC-1632 and AC-1633 lives in `tests/reconciliation-system-knowledge-base.test.ts`. In the quality run (`REPORT-7527` / `report-52d14b4f`), that whole file failed at import with `Cannot find module './generated/ai-workers.js'`, raised from `apps/control-app/src/ai.ts:57`. So its 18 tests were never collected, and the coverage check counted their ACs as untested.

**Why it isn't a test defect:**
- **Production code, not the test, pulls in the shims.** The import chain is `tools/generate/src/cli` → `router.ts` → `ai.ts`, which imports the generated shims in `apps/control-app/src/generated/`. That directory is gitignored and is written only by `1c assets`.
- **The worktree hadn't been built yet.** The run's vitest pass finished around 01:08:57; the shims appeared at 01:09:32. The sibling tests (packed, shipping-gate) write only to tmpdirs, so this wasn't a race between tests.
- **The fix would be in frozen code or the environment.** More than 20 other test files import the same chain.

**Verification:**
- The failing file on its own: 18 passed.
- All four of the story's test files (`…knowledge-base`, `…-packed`, `…-shipping-gate`, `…-account-discovery`): 29 passed.
- Each of the 17 ACs has a matching `test_UAT_AC<N>_*` test in the first file: `AC1291` at line 415 through `AC1633` at line 1214, plus `AC1297` at line 1292.

**Suggested fix:** the quality setup in `.xgd/quality.yaml` has no step that generates the shims before tests, so any fresh reconcile worktree will hit this again. Adding a pre-test `1c assets` run (or a vitest `globalSetup` that does it) would stop it. That's a config or production-code change, outside what this pass is allowed to touch.

```yaml
## Assessment
blocked_by: null
status: resolved_without_edits
evidence: "REPORT-7527 shows tests/reconciliation-system-knowledge-base.test.ts failed to import (ERR_MODULE_NOT_FOUND ./generated/ai-workers.js) at 01:08:55; the generated dir was written at 01:09:32. Re-running all four story test files now gives 4 files and 29 tests passed, covering every AC in the batch."
note: "The import is in frozen production code (cli -> router.ts -> ai.ts -> generated/), so the test is correct. Optional follow-up: generate the shims before the quality run so fresh worktrees don't fail this way."
```
