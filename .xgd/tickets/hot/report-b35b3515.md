---
uid: report-b35b3515
id: REPORT-11791
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T09:35:56.410881+00:00'
updated_at: '2026-11-09T09:35:56.410881+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: AC-688 is orphaned only because its three-engine test cleanly skips
      (as the AC permits) on a host whose Playwright cache has firefox-1538/webkit-2336
      instead of the firefox-1532/webkit-2311 that pinned playwright 1.61.1 needs,
      and the XGD coverage gate counts that permitted skip as no coverage (XGD BUG-1696);
      no repo change can clear it.
    instructions: Make no edits. This batch only lets the gate re-confirm the Chromium-only
      AC-683 round-trip evidence, which shares the capture path with AC-688. Do not
      touch AC-688, its test, engineAvailable, the Playwright pin or the lockfile.
      AC-688 is excluded under the BUG-1067 tooling-defect rule (XGD BUG-1696) and
      clears only after an operator runs `pnpm --filter @1stcontact/generate exec
      playwright install webkit firefox` outside the sandbox. If the gate shows AC-683
      red with real failure output, fix from that evidence.
    test_scope: test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or
        browser-engine availability, so rung 1 does not decide.
      rung2: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json
        with the same three-engine skip guard as the working tree, so the reference
        asks for no code or dependency change.
      rung3: 'Decided at rung 3: tests and code stand; AC-688 orphan status is XGD
        tooling defect BUG-1696 plus a sandbox-refused browser install (~/Library/Caches/ms-playwright
        still lacks firefox-1532/webkit-2311 at iteration 19), excluded from batches
        per BUG-1067.'
  fix_iteration: 19
---

# Fix Plan — Iteration 19

## Hypothesis
AC-688 is orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips cleanly (the AC allows this). It skips because the host's Playwright cache still lacks the firefox-1532 and webkit-2311 builds that the pinned playwright ^1.61.1 needs. The XGD coverage gate counts that permitted skip as no coverage (XGD tooling defect BUG-1696). No repo change can clear it.

## Analysis
- **Quality report:** REPORT-11790 (report-204c0a18): 54 passed, 0 failed, lint/build/preflight clean. The only failure is the orphan-AC check on AC-688.
- **Changes since iteration 18:** only `.xgd/_changes/*` and the new quality report. No source, test, AC or dependency change.
- **Environment, re-checked this iteration:** `~/Library/Caches/ms-playwright` holds `firefox-1538` and `webkit-2336` and still no `firefox-1532` or `webkit-2311`. `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts`) therefore still returns false for webkit and firefox, and the `it.runIf(allEnginesReady)` guard in `tests/reconciliation-l1-substrate.test.ts` skips the test.
- **History:** every builder assessment since REPORT-11728 gives the same diagnosis. The sandbox refused the builder's install attempt with `EPERM` on the browser cache (REPORT-11732). Iterations 14–18 excluded AC-688 under the BUG-1067 rule, and each came back `no_change`.
- **Hypothesis count:** confirmed far more than three times. Escape (b) applies: the diagnosis is correct, and the blocker is XGD coverage tooling plus an operator-only browser install. It is not an overridable mode rule.
- **Rejected alternatives (unchanged):**
  - Bumping Playwright to match the stale cache contradicts the reference pin, and no intent in scope asks for it.
  - Rewriting the test to pass without engines would be false evidence.
  - Superseding AC-688 would drop real, implemented behaviour that the reference state keeps.
- **Excluded under BUG-1067:** AC-688 / `test_UAT_AC688_no_layout_divergence_across_three_engines`, XGD BUG-1696. It clears once an operator runs `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent skip) — when the test skips, it should report which engine failed to launch and why, so a missing browser build shows in the report.

## Batches
- **Batch 0 (no edits):** re-confirms AC-683, the Chromium-only round-trip evidence that shares AC-688's capture path. AC-688 is left out of the batches under the BUG-1067 rule (BUG-1696).

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 3:**
  - Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) touches browser-engine availability.
  - Rung 2: the reference pins playwright ^1.61.1 (`tools/generate/package.json`) with the same skip guard.
  - Rung 3: the tests and code stand. The orphan is tooling defect BUG-1696 plus a sandbox-refused browser install.
