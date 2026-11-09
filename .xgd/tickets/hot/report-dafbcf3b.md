---
uid: report-dafbcf3b
id: REPORT-11776
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T08:59:20.775506+00:00'
updated_at: '2026-11-09T09:06:48.754298+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: AC-688 is orphaned only because its three-engine test skips on a machine
      whose Playwright cache lacks WebKit 2311/Firefox 1532 and the gate counts that
      permitted skip as no coverage (XGD BUG-1696); no repo change can fix it.
    instructions: Make no edits. This batch exists so the gate re-confirms the Chromium-only
      AC-683 evidence stays green. Do not touch AC-688, its test, engineAvailable,
      the Playwright pin or the lockfile; AC-688 is excluded under the BUG-1067 tooling-defect
      rule (BUG-1696) and clears only when an operator runs `pnpm --filter @1stcontact/generate
      exec playwright install webkit firefox` outside the sandbox.
    test_scope: test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or
        browser availability, so rung 1 does not decide.
      rung2: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21
        with the same three-engine skip guard as the working tree, so the AC and test
        stay as written.
      rung3: Tests stand; AC-688 orphan status is XGD tooling defect BUG-1696 plus
        a sandbox-blocked browser install, excluded from batches per BUG-1067.
  fix_iteration: 16
  batches_pending: false
---

# Fix Plan — Iteration 16

## Hypothesis
AC-688 is orphaned only because its sole test (`test_UAT_AC688_no_layout_divergence_across_three_engines`) skips: this machine's Playwright browser cache lacks the WebKit 2311 / Firefox 1532 builds Playwright 1.61.1 requires. The coverage gate counts an environment-permitted skip as "no passing test", which is XGD tooling defect BUG-1696. Nothing in the repo is wrong.

## Analysis
- Quality report REPORT-11775 (report-8bcc04fe): 54 passed, 0 failed; the only failure is the matrix check for orphaned AC-688. The vitest output shows the AC-688 test `skipped`, not failed.
- Changes since iteration 15: only `.xgd/_changes/*` and the quality report. No source, test, AC, or environment change.
- Prior history: iteration 2's builder tried `playwright install webkit firefox`, and the sandbox refused the write to `~/Library/Caches/ms-playwright` (EPERM). Iterations 14 and 15 left AC-688 out under the BUG-1067 tooling-defect rule. In iteration 15 the builder confirmed it made no edits (REPORT-11772, report-aeb32ca1, `no_change_needed`).
- Hypothesis count: "environment browser cache + BUG-1696" has been the diagnosis since iteration 2 and is confirmed. No plan can change the outcome from inside this run. A structurally different hypothesis would have to be invented, which this plan does not do. Under BUG-1067, AC-688 is left out of the batches and BUG-1696 is recorded in `ladder.rung3`.
- Options rejected:
  - Bumping or downgrading Playwright: this violates the pin `"playwright": "^1.61.1"` at `tools/generate/package.json:21` in `reconcile-src-BUNDLE-43`.
  - Deprecating AC-688: the feature exists, and the AC itself allows a skip when the engines are missing.
  - Weakening or un-skipping the test: forbidden.
- No `blocked_by` request is attached to this iteration, so no ruling is required.

**Operator action to clear the AC (run once, outside the sandbox):**
`pnpm --filter @1stcontact/generate exec playwright install webkit firefox`

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent skip) — record which engine failed to launch and why in the skip reason, so the gate report names the missing browser.

## Batches
One batch, for the Chromium-only sibling AC-683 test. It needs no edits and is kept so the gate re-confirms that the L1 substrate rendering evidence stays green. AC-688 is deliberately not batched (BUG-1067 rule; tooling defect BUG-1696 plus a sandbox-blocked browser install).

## Resolution ladder (REQ-938)
Batch 0:
- Rung 1: none of the intents in scope (REQ-219/220/221/222, BUG-78) touches Playwright or browser availability, so rung 1 does not decide.
- Rung 2: at `reconcile-src-BUNDLE-43`, the Playwright pin at `tools/generate/package.json:21` and the three-engine skip condition match the working tree, so the dependency, the AC and the test stay as written.
- Rung 3: the tests stand. AC-688's orphan status is caused by tooling defect BUG-1696 together with a missing local browser install, and can't be fixed in this story.