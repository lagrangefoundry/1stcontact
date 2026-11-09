---
uid: report-fa9a7949
id: REPORT-11952
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T16:44:27.779350+00:00'
updated_at: '2026-11-09T16:44:27.779350+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 55
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    dependency_tests:
    - test_UAT_AC683_
    hypothesis: 'No repo defect remains: AC-688 skips because webkit-2311/firefox-1532
      (required by pinned playwright 1.61.1) are not installed and the sandbox denies
      Chromium mach-port rendezvous, and XGD BUG-1695 counts that AC-allowed skip
      as an orphan.'
    instructions: 'Verification only; edit no tracked file and install nothing. Confirm
      test_UAT_AC687_ and test_UAT_AC683_ stay green and report status verified_green.
      AC-688 is excluded by the BUG-1067 rule: its root cause is confirmed (report-a1e290ac
      launch errors) and lies outside this story (operator browser install plus XGD
      BUG-1695), so do not probe, retry installs, or touch the AC-688 test.'
    test_scope: test_UAT_AC687_ or test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touches
        cross-engine browser availability, and AC-688 itself allows a clean skip when
        engines are absent.
      rung2: reconcile-src-BUNDLE-43 has the same runIf-guarded AC-688 test and pins
        playwright ^1.61.1 at tools/generate/package.json:21, giving no ground to
        align or override.
      rung3: 'Tests stand, no code change demanded; AC-688 stays orphaned on XGD BUG-1695
        plus operator action: pnpm --filter @1stcontact/generate exec playwright install
        webkit firefox (outside sandbox) and an unsandboxed gate run for test_UAT_AC688_.'
---

# Fix Plan — Iteration 55

## Hypothesis
No repo defect remains. AC-688's only test (`test_UAT_AC688_no_layout_divergence_across_three_engines`) is skipped by its `allEnginesReady` guard, as the AC allows. It skips for two reasons:
- Missing browser builds (confirmed, not hypothesised): Playwright 1.61.1 needs webkit-2311 and firefox-1532, and they are not installed.
- Sandbox: it blocks the Chromium launch (Mach port rendezvous denied).

XGD BUG-1695 counts that allowed skip as an orphan AC.

## Analysis
- Quality report REPORT-11951 (report-40fd7818) shows lint, build and preflight green, and 54/54 tests passed with 0 failed. The only finding is orphan AC-688. The only files changed since the last iteration are `.xgd` bookkeeping.
- The root cause is now **observed, not inferred**. In report-a1e290ac (iteration 53's assessment), the builder's probe captured the real launch errors:
  - webkit: `Executable doesn't exist at ~/Library/Caches/ms-playwright/webkit-2311/pw_run.sh`
  - firefox: `Executable doesn't exist at ~/Library/Caches/ms-playwright/firefox-1532/.../firefox`
  - chromium inside the sandbox: `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)`
- I re-checked read-only this iteration: `~/Library/Caches/ms-playwright` still holds only firefox-1538, webkit-2336 and chromium 1228/1234/1243/1248. Nothing has changed.
- Applying the BUG-1067 rule:
  - The test is blocked by an XGD tooling defect (BUG-1695: an AC-allowed environment skip is counted as an orphan).
  - It is also blocked by operator-only actions: a browser install and the sandbox allowance.
  - Neither can be done within this story's constraints. In-sandbox installs were refused with EPERM in report-d973247a, and code, package.json and the lockfile are frozen.
  - AC-688 is therefore **left out of the batches**, and BUG-1695 is recorded in `ladder.rung3`.
- Hypothesis-repeat rule: the "exclude AC-688 / record BUG-1695" disposition has repeated for about 40 iterations. Iteration 53 changed the work instead of repeating it: it collected the missing fact (the verbatim launch errors). That fact settles the diagnosis, so no further in-repo hypothesis is left to try. The ladder decides at rung 3: the test and AC stand, and no code change is demanded. Planning another diagnostic would add nothing.
- Alternatives I considered and rejected:
  - **aligned_to_tip:** AC-688 and its runIf-guarded test match the reference. The AC itself allows a clean skip, so there is no AC/code disagreement to align.
  - **code_frozen override to re-pin playwright:** the reference pins `playwright ^1.61.1` at `tools/generate/package.json:21`. A re-pin would also be a dependency change that needs network access, and it would still hit the Chromium sandbox denial. Rung 2 keeps the pin.
- **Operator actions that end the loop:**
  1. From a normal terminal, run `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` in the repo root. Then run the gate for `test_UAT_AC688_` outside the sandbox.
  2. Or fix XGD BUG-1695, so that an AC-allowed environment skip is not counted as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (environment-gated) — the `allEnginesReady` probe discards the launch error. A skip should log the error, so the reason for a skip is visible in the gate output without a manual probe.

## Batches
- **Batch 0** (`test_UAT_AC687_`, `test_UAT_AC683_`): keep-green verification only. Both pass in every recent report. AC-683 exercises the same capture driver with Chromium. The builder edits nothing and confirms both stay green.
- AC-688 is deliberately not batched, per the BUG-1067 rule. Its blocker is recorded in rung 3.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 3.**
  - Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) touches cross-engine availability. AC-688 explicitly allows the skip.
  - Rung 2: the reference has the same guarded test and the same `playwright ^1.61.1` pin, so there are no grounds to align or override.
  - Rung 3: the tests stand. AC-688 is blocked on XGD BUG-1695 plus the operator browser install (webkit-2311 and firefox-1532) and the sandbox allowance.
