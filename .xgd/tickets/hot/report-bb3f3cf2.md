---
uid: report-bb3f3cf2
id: REPORT-11786
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T09:24:20.969813+00:00'
updated_at: '2026-11-09T09:31:22.412630+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 18
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
      rung2: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21
        with the same three-engine skip guard as the working tree, so the reference
        asks for no code or dependency change.
      rung3: 'Decided at rung 3: tests and code stand; AC-688 orphan status is XGD
        tooling defect BUG-1696 plus a sandbox-refused browser install (~/Library/Caches/ms-playwright
        still lacks firefox-1532/webkit-2311 at iteration 18), excluded from batches
        per BUG-1067.'
  batches_pending: false
---

# Fix Plan — Iteration 18

## Hypothesis
AC-688 is orphaned only because its single test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips cleanly (as the AC permits). It skips because this host's Playwright cache lacks the firefox-1532 and webkit-2311 builds that the pinned playwright ^1.61.1 needs. The XGD coverage gate counts that permitted skip as no coverage (XGD tooling defect BUG-1696, earlier BUG-1695). No repo change can clear it.

## Analysis
- **Quality report:** REPORT-11785 (report-11f2fc6d): 54 passed, 0 failed, lint/build/preflight clean. The only failure is the orphan-AC check on AC-688.
- **Changes since iteration 17:** only `.xgd/_changes/*` and the new quality report. No source, test, AC or dependency change.
- **Environment, re-checked this iteration:** `~/Library/Caches/ms-playwright` still holds `firefox-1538` and `webkit-2336` and no `firefox-1532` or `webkit-2311`. `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts`) still returns false for webkit and firefox, so `it.runIf(allEnginesReady)` in `tests/reconciliation-l1-substrate.test.ts` still skips.
- **History:** all 12 builder assessments (REPORT-11728 … REPORT-11782) give the same diagnosis. Iteration 2's builder attempt to install the browsers was refused by the sandbox (`EPERM mkdir ~/Library/Caches/ms-playwright/__dirlock`, REPORT-11732). Iterations 14–17 excluded AC-688 under the BUG-1067 rule, and the builder returned `no_change` each time (latest REPORT-11782).
- **Hypothesis count:** confirmed far more than three times. Escape (b) applies: the diagnosis is correct, and the blocker is XGD coverage tooling plus an operator-only action. It is not a mode rule this plan can lift.
- **Rejected alternatives (unchanged):**
  - Bumping Playwright to match the stale cache contradicts the reference pin, and no intent in scope asks for it.
  - Rewriting the test to pass without engines would be false evidence.
  - Superseding AC-688 would drop real, implemented behaviour.
  - Adding a skip marker is forbidden.
- **AC-688 is left out of the batches** per BUG-1067, citing XGD BUG-1696. **Operator action that clears it** (run outside the sandbox): `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (on skip) — when it skips, have it record which engine failed to launch and the launch error, so the gate report names the missing browser revision.

## Batches
- **Batch 0** is a no-edit carrier batch on AC-683, the Chromium-only round-trip that shares AC-688's capture path. The gate re-confirms it stays green, and the batch records the ladder for AC-688's exclusion.

## Resolution ladder (REQ-938)
- **Batch 0** was decided at rung 3:
  - **Rung 1:** no intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or engine availability.
  - **Rung 2:** reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21 with the same skip guard.
  - **Rung 3:** the tests and code stand. AC-688's orphan status is XGD tooling defect BUG-1696 plus an operator-only browser install.