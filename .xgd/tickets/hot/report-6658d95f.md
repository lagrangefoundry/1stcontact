---
uid: report-6658d95f
id: REPORT-11957
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T16:57:55.519184+00:00'
updated_at: '2026-11-09T17:05:44.188948+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: 'No repo defect remains: AC-688 skips because webkit-2311/firefox-1532
      required by pinned playwright 1.61.1 are absent (cache re-checked: only webkit-2336/firefox-1538)
      and the sandbox denies Chromium launch; XGD BUG-1695 counts that AC-allowed
      skip as an orphan.'
    instructions: Verification only; edit no tracked file and install nothing. Confirm
      test_UAT_AC687_ and test_UAT_AC683_ stay green and report verified_green. AC-688
      is excluded under the BUG-1067 rule (XGD BUG-1695 plus operator browser install);
      do not probe, retry installs, or touch the AC-688 test.
    test_scope: test_UAT_AC687_ or test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touches
        cross-engine browser availability, and AC-688 allows a clean skip when engines
        are absent.
      rung2: reconcile-src-BUNDLE-43 has the same runIf-guarded AC-688 test and pins
        playwright ^1.61.1 at tools/generate/package.json:21, so there is nothing
        to align or override.
      rung3: Tests stand with no code change; AC-688 stays orphaned on XGD BUG-1695
        until the operator runs pnpm --filter @1stcontact/generate exec playwright
        install webkit firefox outside the sandbox and an unsandboxed gate run for
        test_UAT_AC688_.
  fix_iteration: 56
  batches_pending: false
---

# Fix Plan — Iteration 56

## Hypothesis
No repo defect remains. AC-688's only test (`test_UAT_AC688_no_layout_divergence_across_three_engines`) is skipped by its `allEnginesReady` guard, as the AC allows. It skips because Playwright 1.61.1 needs webkit-2311 and firefox-1532, which are not installed, and because the sandbox refuses the Chromium launch. XGD BUG-1695 counts that allowed skip as an orphan AC.

## Analysis
- Quality report REPORT-11956 (report-ec6c1fc5): lint, build and preflight are green, 54/54 tests passed and 0 failed. The only finding is orphan AC-688. Since iteration 55 only `.xgd` bookkeeping files have changed.
- Iteration 55's assessment (report-f4aac128): AC-687 passed. AC-683 was skipped because it is engine-gated and no browser can start in the sandbox. No edits were made.
- The root cause is still the one observed in report-a1e290ac (iteration 53). These are real launch errors:
  - webkit: `Executable doesn't exist at ~/Library/Caches/ms-playwright/webkit-2311/pw_run.sh`
  - firefox: `Executable doesn't exist at .../firefox-1532/...`
  - chromium inside the sandbox: `MachPortRendezvousServer: Permission denied (1100)`
- I re-checked `~/Library/Caches/ms-playwright` read-only this iteration. It still holds only firefox-1538, webkit-2336, chromium 1228/1234/1243/1248 and ffmpeg. The operator has not installed anything.
- **BUG-1067 rule:** AC-688 is blocked by the XGD tooling defect BUG-1695 (a skip the AC allows is counted as an orphan) and by operator-only actions (a browser install and a sandbox allowance). Neither can be done within this story's constraints: code, package.json and the lockfile are frozen in reconcile mode, and in-sandbox installs returned EPERM (report-d973247a). AC-688 is therefore left out of the batches, and BUG-1695 is recorded in `ladder.rung3`.
- **Hypothesis-repeat rule:** this disposition has now repeated many times. The rule's alternatives don't fit:
  - (a) There is no structurally different hypothesis. The cause is observed, not inferred.
  - (c) A rung-3 code change cannot make the browser builds exist or lift the sandbox.
  - BUG-1067 explicitly forbids re-batching the test.
- **The loop cannot converge by itself.** It needs either step below. Further planner iterations will not change this.
  1. The operator runs `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox, then an unsandboxed gate run for `test_UAT_AC688_`.
  2. XGD BUG-1695 is fixed.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths — weak-observation (environment-gated) — it skips silently whenever Chromium can't launch, so a "green" gate may hold no evidence. Consider having the gate record the skip as not-run rather than pass.

## Batches
- Batch 0 is verification only: keep `test_UAT_AC687_` and `test_UAT_AC683_` green. The builder edits nothing and installs nothing. AC-688 is excluded under the BUG-1067 rule.

## Resolution ladder (REQ-938)
- **Batch 0 was decided at rung 3.**
  - Rung 1: no intent in scope addresses browser availability, and AC-688 allows a clean skip.
  - Rung 2: `reconcile-src-BUNDLE-43` has the same `runIf`-guarded test and pins playwright `^1.61.1` (`tools/generate/package.json:21`), so there is nothing to align to.
  - Rung 3: the tests stand and no code change is demanded. AC-688 stays orphaned on BUG-1695 until the operator acts.