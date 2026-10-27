---
uid: report-f3f85f43
id: REPORT-6796
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-10-27T20:49:54.974478+00:00'
updated_at: '2026-10-27T20:49:54.974478+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-47fb84e6
---

I wrote 8 UATs for story-47fb84e6, one per AC: 7 pass and 1 fails. The failure is a gap in the existing code, not a bad test, so I left the assertion as the AC specifies.

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - **`test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work`**: the part about the browser holds. The refusal comes before any lease or navigation, and the message names `'never-captured'`. The error itself is wrong: it reads `Bundle 'never-captured' has no capture.json.`, so it doesn't point at `list_references` and isn't a `PictureNotFoundError`.
    - **Cause:** `captureOf` in `tools/generate/src/cli/ai/fidelity-core.ts:245` expects `readCapture` to return null for a missing bundle and then throw the proper not-found error. But `readCapture` (`tools/generate/src/cli/capture/bundle.ts:97`) throws a generic `Error` itself, so the intended error never runs.
    - **Fix (production code, which I'm not allowed to change here):** have `captureOf` read `capture.json` in a way that can return null.

| AC | Test | Result |
|---|---|---|
| AC-2036 | `compare` gives the same answer as `1c diff`, with regions as coordinates and no file outputs | pass |
| AC-2037 | `compare` crops both pictures to their shared top-left rectangle and reports that size | pass |
| AC-2038 | `compare` takes any two picture kinds and labels each side | pass |
| AC-2039 | `check_fidelity` returns the full gate report over the real bundle | pass |
| AC-2040 | each of the five verdicts has its own condition and a distinct next step | pass |
| AC-2041 | the reference side is read at the viewport the actual picture asked for | pass |
| AC-2042 | a missing ladder member falls back to the full-page shot and says so in the label | pass |
| AC-2043 | an unknown reference is refused by name before any browser work | **fail** |

Run with `npx vitest run --config vitest.node.config.mts`. I couldn't run eslint: it isn't installed locally and the sandbox blocked downloading it from the npm registry.

UATs generated for story story-47fb84e6 (plan item 5 of 9)

Story: story-47fb84e6
Test file(s) created:
  - tests/test_reconciliation_fidelity_compare_and_judge.test.ts

Tests written: 8
Tests passed: 7
Tests failed: 1

test_files_created:
  - "tests/test_reconciliation_fidelity_compare_and_judge.test.ts"
