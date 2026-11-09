---
uid: report-7e8f69fc
id: REPORT-11962
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T17:11:35.690336+00:00'
updated_at: '2026-11-09T17:11:35.690336+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 57
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: 'No repo defect remains: AC-688 skips (as the AC allows) because webkit-2311/firefox-1532
      required by pinned playwright 1.61.1 are absent from the host cache (re-checked:
      only webkit-2336/firefox-1538), and XGD BUG-1695 counts that allowed skip as
      an orphan.'
    instructions: Verification only; edit no tracked file and install nothing. Confirm
      test_UAT_AC687_ passes; report test_UAT_AC683_ as engine-gated if Chromium cannot
      launch in the sandbox (it passes in the gate run). AC-688 is excluded under
      the BUG-1067 rule (XGD BUG-1695 plus operator browser install); do not probe,
      retry installs, request a playwright bump, or touch the AC-688 test.
    test_scope: test_UAT_AC687_ or test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touches
        cross-engine browser availability, and AC-688 explicitly allows a clean skip
        when engines are absent.
      rung2: reconcile-src-BUNDLE-43 has the same runIf-guarded AC-688 test and pins
        playwright ^1.61.1 at tools/generate/package.json:21, so there is nothing
        to align or override.
      rung3: Tests stand with no code change; AC-688 stays orphaned on XGD BUG-1695
        until the operator runs pnpm --filter @1stcontact/generate exec playwright
        install webkit firefox outside the sandbox and re-runs the gate for test_UAT_AC688_,
        or BUG-1695 is fixed in XGD.
---

# Fix Plan — Iteration 57

## Hypothesis
No repo defect remains. AC-688's only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, is skipped by its `allEnginesReady` guard, which AC-688 itself allows. It skips because playwright 1.61.1 needs webkit-2311 and firefox-1532, and those are not installed. XGD BUG-1695 (bug-9093c69f) counts that allowed skip as an orphan AC.

## Analysis
- Quality report REPORT-11961 (report-4a64d448): lint, build and preflight are green, and 54/54 tests passed with 0 failed. The gate fails only on orphan AC-688.
- Since iteration 56, only `.xgd` bookkeeping files changed (`_changes/log.ndjson`, `meta.json`, the quality report). No test, AC or production code changed.
- `~/Library/Caches/ms-playwright` was re-checked read-only this iteration. It still holds only firefox-1538, webkit-2336, chromium 1228/1234/1243/1248 and ffmpeg 1011/1013. The operator has not installed the builds that playwright 1.61.1 needs (firefox-1532, webkit-2311).
- Iteration 56's assessment (REPORT-11958, report-5438efcd):
  - AC-687 verified green.
  - AC-683 was skipped in the builder sandbox: Chromium cannot launch there (MachPortRendezvousServer permission denied). It passes in the gate run.
  - No edits were made.
- **BUG-1067 rule:** AC-688 is blocked by an XGD tooling defect (BUG-1695) plus operator-only actions: installing browsers outside the sandbox, which the sandbox refused with EPERM in earlier iterations. Code, package.json and the lockfile are frozen in reconcile mode. AC-688 is therefore NOT re-batched; BUG-1695 is recorded in `ladder.rung3`.
- **Hypothesis-repeat rule:** this disposition has repeated since iteration 7, roughly 50 times.
  - (a) There is no structurally different hypothesis. The cause is observed directly: launch errors "Executable doesn't exist at .../webkit-2311/pw_run.sh" and ".../firefox-1532/...".
  - (b) There is no mode rule to rule on. Bumping playwright was declined at rung 2 in iteration 7 (the reference pins ^1.61.1 at tools/generate/package.json:21), and no `blocked_by` is outstanding.
  - (c) Rung 3 is already the decision: the test stands, and no code change can install host browsers.
  - Further iterations cannot converge. The run should end with the diagnostic report.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0 is verification only and makes no edits. It keeps AC-687 and AC-683 green as the story's blast radius.
- AC-688 is excluded under the BUG-1067 rule.

## Resolution ladder (REQ-938)
- **Rung 1:** silent. No intent in scope (REQ-219/220/221/222, BUG-78) touches cross-engine browser availability, and AC-688 explicitly allows a clean skip.
- **Rung 2:** reconcile-src-BUNDLE-43 has the same runIf-guarded test and pins playwright ^1.61.1 (tools/generate/package.json:21). There is nothing to align or override.
- **Rung 3 (decides):** the tests stand with no code change. AC-688 stays orphaned on XGD BUG-1695 until either of these happens:
  - the operator runs `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox and re-runs the gate for `test_UAT_AC688_`;
  - BUG-1695 is fixed in XGD.
