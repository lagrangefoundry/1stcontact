---
uid: comment-dccfc131
id: COMMENT-2470
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T05:29:18.810757+00:00'
updated_at: '2026-09-10T05:29:18.810757+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-31027fde
  kind: note
---

Report filed: **REPORT-3671 (report-31027fde)** — **FAIL**, 1 violation, 2 warnings, 0 needs_review.

## What I found

Unlike the previous pass, I **ran** all three suites. **17 of 18 UATs pass; one fails deterministically.**

**Violation — AC-1331's UAT is red.** `tests/reconciliation-platform-build-deploy-smoke.test.ts:641-660`, the `--skip-preflight` leg, reuses the crippled environment from the preceding leg (`UAT_HIDDEN_SPECS: ["@lagrangefoundry/webui-shell"]` + the hide hook via `NODE_OPTIONS`) and then asserts the build exits 0. But `--skip-preflight` gates only `step "Preflight"` (`bin/build:87-90`); the very next stage, `step "Control-app assets"` → `bin/1c assets` (`bin/build:98-99` — the stage AC-1427 owns), is unconditional and needs the same hidden component. Output: `==> Control-app assets` / `@lagrangefoundry/webui-shell is not installed`, exit 1.

This is environment-independent, not a worktree artifact: the test's *first* leg runs the same real `bin/build` with nothing hidden and passes (exit 0 asserted at line 595), so the component resolves here — the skip leg differs only by hiding something a non-skippable stage requires. The criterion doesn't ask for what the test asserts ("the later stages **proceed**", not "the build exits zero"), so the fix is `uat-edit`, not a code change. The premise went stale when BUNDLE-20 reconciled the assets stage as AC-1427, after BUNDLE-19 wrote this UAT.

**Warnings.** (1) The previous cycle's AC-1426 repair is genuinely landed and verified — AC-1426, STORY-119 and the UAT now agree, and it passes — but the test file's header docblock (lines 15-16) still carries the old "naming the import chain that got there"; commit `c0e58ccdb4` fixed the test name and inline comment, not the header. (2) The free-coded UAT set that reconciliation superseded is still present and duplicates the matrix in the same shape — `test_UAT_FC_REQ-149_worker_type_program.test.ts` is AC-1426's first two blocks with the nine-module list and the whole walk copy-pasted; `test_UAT_FC_BUG-37_observability.test.ts` and `test_UAT_FC_REQ-144_deploy_scripts.test.ts` repeat AC-1454/1455 and ~12 of AC-1330…AC-1342. Not a violation (FC files aren't matrix elements), but two copies of that module list will drift.
