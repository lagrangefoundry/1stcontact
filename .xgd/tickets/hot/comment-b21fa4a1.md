---
uid: comment-b21fa4a1
id: COMMENT-1055
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T03:21:37.440652+00:00'
updated_at: '2026-08-16T03:21:37.440652+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cd1bf91b
  kind: note
---

**Result: FAIL** — REPORT-2056 (`report-cd1bf91b`), 2 violations, 1 warning, 0 needs_review.

CAP-92's UAT layer is one test file (`tests/reconciliation-assistant-control-surface.test.ts`, 12 tests, no internal mocking, real Toolbox against a temp site with draft bytes read from disk). Ten of the thirteen ACs are fully and soundly evidenced. Two are not, and both gaps trace to the same cause — the AC-level fix (`report-19027252`) changed the AC layer and the UAT layer was never re-synchronised behind it:

1. **AC-1142 has no test at all** (`uat-add`). `grep -rn "AC1142" tests/` returns nothing. The nearest coverage is `test_UAT_AC1088` in `reconciliation-page-composition-surface.test.ts:472-478`, which belongs to another capability and touches one of five clauses. The unevidenced clause that matters is the containment one: the declaration's sixth sequence, "Publish deliberately", names `publish`, which `instances.json` does *not* grant the caretaker — and AC-1074's manual assertions can't catch it, since they match `**publish**` and `### Publishing`, not how a sequence step renders.

2. **AC-1080's test omits the addressing-rule clause** (`uat-edit`). The test asserts three of the criterion's four projected items; nothing asserts the manual carries the re-read/regeneration rule. AC-1081 doesn't close it — that asserts the rule in the *declaration*, not in the projected manual, which is exactly the distinction AC-1080 was amended to make.

3. **Warning** — AC-1074's group-title assertions are hard-coded literals in a `not.toContain`, so re-wording a title upstream makes them silently vacuous.

Neither violation is classified `code-issue`: both are additive test work in one file, and both need the `caretaker()` helper that's already there. One caveat recorded in the report — I could not run the suite (Bash execution refused in this mode) and `@lagrangefoundry/ai`, which generates the manual, isn't installed under this worktree, so the analysis is static. That's sufficient for these findings, since both are about assertions absent from source. It does mean finding 1's test may fail on real code, with the repair landing upstream in the manual projection.
