---
uid: report-b63444d3
id: REPORT-11811
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T10:24:31.060520+00:00'
updated_at: '2026-11-09T10:31:43.335994+00:00'
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
    hypothesis: AC-688 is orphaned only because its three-engine test skips (as the
      AC permits) on a host still lacking the firefox-1532/webkit-2311 builds that
      pinned playwright ^1.61.1 needs, and the XGD coverage gate counts that permitted
      skip as no coverage (XGD BUG-1696, environment BUG-1695); no repo change can
      clear it.
    instructions: Make no edits. This batch only lets the gate re-confirm the Chromium-only
      AC-683 round-trip evidence, which shares the capture path with AC-688. AC-688
      and its test are excluded under the BUG-1067 tooling-defect rule (XGD BUG-1696
      / BUG-1695); leave them, engineAvailable, the Playwright pin and the lockfile
      untouched. AC-688 clears only after an operator runs `pnpm --filter @1stcontact/generate
      exec playwright install webkit firefox` outside the sandbox. If the gate shows
      AC-683 red with real failure output, fix from that evidence.
    test_scope: test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or
        browser-engine availability, so rung 1 does not decide.
      rung2: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21,
        matching the working tree, so the reference asks for no code or dependency
        change.
      rung3: 'Decided at rung 3: tests and code stand; the AC-688 orphan is XGD tooling
        defect BUG-1696 plus the sandbox-refused browser install BUG-1695 (cache still
        has only firefox-1538/webkit-2336 as of iteration 23), excluded from batches
        per BUG-1067.'
  fix_iteration: 23
  batches_pending: false
---

# Fix Plan — Iteration 23

## Hypothesis
AC-688 shows as orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips. The AC allows that skip: the host still lacks the WebKit and Firefox builds that the pinned playwright ^1.61.1 needs (firefox-1532, webkit-2311). The XGD coverage gate counts a permitted skip as "no passing test" (XGD BUG-1696; the missing browsers are tracked as BUG-1695). No change in the repo can clear it.

## Analysis
- **Quality report REPORT-11810 (report-024c21dc):** javascript-vitest has 54 passed, 0 failed, 13 deselected. Lint, build and preflight are clean. The only failure is the AC Coverage orphan on AC-688.
- **Changes since iteration 22:** only `.xgd/_changes/*` and the new quality report. No change to source, tests, ACs or dependencies.
- **Environment, re-checked this iteration:** `~/Library/Caches/ms-playwright` holds chromium-1228/1234/1243/1248, ffmpeg-1011/1013, firefox-1538 and webkit-2336. The required firefox-1532 and webkit-2311 are still absent. The lockfile resolves only playwright@1.61.1 and playwright-core@1.61.1 (`pnpm-lock.yaml:1614,1619`).
- **Builder history:** assessments report-d973247a, report-dacf5f5d, report-e1a15631, report-721d5131 and report-b6efb28f all mark the test `stuck`, citing the sandbox refusing the browser install (`EPERM mkdir ~/Library/Caches/ms-playwright/__dirlock`) and BUG-1695 / BUG-1696. No assessment carries an overridable `blocked_by` rule. Builders ruled out bumping Playwright, editing the probe, editing the test or AC, and adding skip markers, and those calls were correct.
- **Hypothesis count:** the same diagnosis has stood for 22 iterations. The cause is a tooling defect plus an operator-only install, not something a mode rule controls. Under the BUG-1067 stuck-reason rule the test is **not re-batched**.
- **Excluded under BUG-1067:** AC-688 / `tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines` (XGD BUG-1696, with BUG-1695 for the environment). It clears once an operator runs `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox, or once XGD stops counting a permitted skip as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (diagnosability) — the skip should name which engine failed to launch and the revision it expected, so the coverage report points straight at the missing build.

## Batches
- **Batch 0 (no edits):** re-runs only the Chromium-only AC-683 round-trip UAT, which shares the capture path with AC-688, so the gate re-confirms that evidence. AC-688 is left out per BUG-1067, and the bug IDs are recorded in the batch's `ladder.rung3`.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 3.**
  - Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or browser-engine availability.
  - Rung 2: `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, matching the working tree, so the reference asks for no code or dependency change.
  - Rung 3: the tests and the code stand. The AC-688 orphan is XGD BUG-1696 (a permitted skip counted as an orphan) together with BUG-1695 (the browser install the sandbox refuses). It is excluded from batches per BUG-1067.

## Operator action required
Run this outside the sandbox, from the repo root:

    pnpm --filter @1stcontact/generate exec playwright install webkit firefox

Then re-run the gate for `test_UAT_AC688_`.