---
uid: comment-c46f2ebb
id: COMMENT-1061
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T04:10:59.076418+00:00'
updated_at: '2026-08-16T04:10:59.076418+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-085270ec
  kind: note
---

Report filed: **REPORT-2062** (`report-085270ec`) — `result=fail`, `level=uat`, violations 1, warnings 2, needs_review 0.

## What the check found

**Coverage is complete.** All 47 active ACs (14 under STORY-98, 33 under STORY-101) have at least one `test_UAT_AC<n>_*` test, and every one drives a real entry point — the `1c` CLI functions, a live builder origin over HTTP, a DOM parsed from the bytes `1c render --edit` wrote, the real `defaultModal` composing the real `webui-fields`, and Playwright where the claim is geometric. No AST-only stand-ins, no internal mocking.

**Violation (1) — AC-1138's test asserts the negation of its AC.** `tests/reconciliation-copy-edit-live-preview.test.ts:515` asserts capitalisation *reaches* the words (measured on `.builder-modal__box .fields-control`); AC-1138 says it never does and its Verification requires asserting the words are unchanged. The test is the correct side — `apps/control-app/src/builder/builder.css:281-284` re-declares the broken inheritance under a REQ-138 comment, REQ-138 (free_and_reconciled) names four parameters, and BUG-35 exists to close it. Resolution is **ac-edit**, the same drift REPORT-2061 raised one level up and still unrepaired.

**Warnings (2)** — both a clause an AC names that its test doesn't reach: AC-1039's "the parameter sheet keeps its labels" (asserted nowhere in the repo), and AC-1044's "two or more fields *to the box* opens none" (the test's two-field case is the image dialog, which is the other bullet).

Two prior findings are now closed and recorded as info: the `settle()` race that made five gesture-modal ACs non-deterministic was repaired in `d4e2d7c98` (~2h after REPORT-1764 was written), and AC-997's multi-field clause is now covered by the image-picker test.

Two caveats I flagged in the report rather than papered over:
- **This session had no permission to run tests** (`vitest`, `pnpm test`, and the local binary were all denied), so every judgement is from reading tests, ACs and the code they exercise. The stored `uat_coverage: fail` stamps on AC-994/1000/1001/1002/1003 date from 08-10 08:52Z and predate the `settle()` repair — they should be re-earned, not read as current.
- The whole image-picker suite is `it.skipIf(!WEBUI_INSTALLED)`, and AC-1112–1116 have no other test, so those five ACs produce no evidence at all where the out-of-band install is absent. I couldn't determine whether it resolves here — `webuiPackageDir` walks above the worktree, outside this session's read permission.

The editor note is explicit about the trap given four previous attempts: editing the live-preview test to match the stale AC would make this level pass while deleting evidence for behaviour REQ-138 asked for.
