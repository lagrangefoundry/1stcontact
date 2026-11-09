---
uid: report-f6f84624
id: REPORT-11766
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T08:34:02.683115+00:00'
updated_at: '2026-11-09T08:41:46.993420+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 14
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: 'AC-688 cannot be closed by any actor inside this run: the fix (installing
      webkit-2311/firefox-1532, or re-resolving playwright within ^1.61.1) needs network
      and writes outside the sandbox, so the run must terminate with the operator
      action recorded.'
    instructions: 'Make no edits. AC-688 is deliberately excluded: its test is correct
      and skips by design because webkit-2311/firefox-1532 are not in the machine
      Playwright cache, and installing them needs network plus a write to ~/Library/Caches/ms-playwright
      that this sandbox refuses (EPERM, report-d973247a); the gate then miscounts
      that sanctioned skip (BUG-1696). This batch only keeps the chromium-only sibling
      AC-683 green in the gate run; a local skip in your sandbox is expected and is
      not a failure. Do not attempt the browser install, do not change the Playwright
      dependency or lockfile, do not touch engineAvailable, and do not rewrite the
      AC-688 test.'
    test_scope: test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    ladder:
      rung1: No intent in scope (REQ-222/221/219/220, BUG-78) touches Playwright,
        browser availability or the AC-688 engine precondition, so rung 1 does not
        decide.
      rung2: 'Decided here: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, and the reference skips AC-688 the same way,
        so the code stays.'
      rung3: 'Tests stand; AC-688 is blocked by the sandbox (operator, outside sandbox:
        pnpm --filter @1stcontact/generate exec playwright install webkit firefox)
        and by XGD tooling defect BUG-1696, so it is not re-batched.'
  batches_pending: false
---

# Fix Plan — Iteration 14

## Hypothesis
Nothing inside this run can close AC-688. Its test is correct and skips by design when WebKit and Firefox can't start. The fix is to install webkit-2311 and firefox-1532, which needs network access and a write to `~/Library/Caches/ms-playwright`. The sandbox blocks both for every step of this run, so the run must end with the operator action recorded rather than loop again.

## Analysis
- Parent quality report report-3e4d65a0 (commit bd6394b1): 54 tests, 0 failed, lint and build clean. The only failure is "AC-688 (orphaned acceptance criterion)". The only changes since iteration 13 are `.xgd/_changes` and that report, so the repo hasn't moved and the browser cache hasn't either: the gate still skips the test.
- History, checked against this subject's uid only:
  - Iterations 1-11 sent `test_UAT_AC688_no_layout_divergence_across_three_engines` (tests/reconciliation-l1-substrate.test.ts:536-569) to the builder. Each time it made no edits. In report-dacf5f5d it raised `blocked_by: code_frozen`, which was declined on rung 2 several times.
  - The builder's install attempt (report-d973247a) failed with `EPERM: mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'`.
  - Iterations 12-13 took the BUG-1067 path: AC-688 was left out of the batches and BUG-1696 (the coverage gate counts a skip the AC allows as no coverage) was recorded. The gate still reports the orphan.
- The "install the pinned browsers" hypothesis has now been tried far more than 3 times. This plan doesn't try it again. It records the structural fact behind every earlier result: whoever closes this gap needs network access and a write outside the sandbox, and no planner, builder or gate step in this run has either. This is a terminal condition, not a fix that keeps being missed.
- Alternatives I looked at again this iteration and rejected:
  - **Bump Playwright within the `^1.61.1` range to the release whose browsers match the cache (webkit-2336, firefox-1538).** The caret range in `tools/generate/package.json:21` at `reconcile-src-BUNDLE-43` does allow a newer 1.x. Earlier plans described the pin more strictly than it is: it is the lockfile, not the manifest, that fixes 1.61.1. But resolving a new version needs the registry and a write to the pnpm store, which the sandbox blocks just as it blocks the browser install. It would also tie the lockfile to one machine's cache. Granting `code_frozen` for a change the builder can't carry out would only burn another cycle, so no override is granted. The operator may choose this route outside the run instead of the install.
  - **Rewrite the test, add a skip marker, or retire or align AC-688.** These are forbidden, or would be false evidence. The reference implements cross-engine capture, so `aligned_to_tip` doesn't apply.
- There is no open `blocked_by` request to rule on. Iterations 12-13 put no builder on AC-688, and the `code_frozen` request in report-dacf5f5d was declined in iterations 2-11.
- I couldn't re-check the browser cache this iteration because the session refused reads under `~/Library/Caches`. The unchanged gate result above is enough evidence that it is still missing those revisions.
- **Operator action that clears AC-688**, run outside the sandbox from the repo root: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`. Then re-run the gate for `test_UAT_AC688_`. The other route is to update the lockfile to the 1.x release that matches webkit-2336 and firefox-1538, also outside the sandbox.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (the skip is silent) — when the test skips, it should name the engine that failed to start and the launch error, so the gate report points straight at the missing browser revision.

## Batches
- Batch 0: no edits. It keeps the Chromium-only sibling test for AC-683 green in the gate run. AC-688 is left out on purpose (BUG-1067 path, BUG-1696, and the sandbox refusal above). This is the same as iteration 13's batch, because nothing a builder could do in the sandbox has changed.

## Resolution ladder (REQ-938)
- Batch 0: rung 1 doesn't decide. No intent in scope (REQ-222, REQ-221, REQ-219, REQ-220, BUG-78) touches Playwright, browser availability or AC-688's engine precondition.
- Rung 2 decides the code. `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, the same as the working tree, and the reference skips AC-688 the same way on this machine. The code is right and stays as it is.
- Rung 3: the tests stand. AC-688 stays uncovered until the operator installs the browsers outside the sandbox, or until XGD fixes BUG-1696. Nothing in the repo is wrong.