---
uid: report-bc0de67a
id: REPORT-11816
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T10:36:23.501549+00:00'
updated_at: '2026-11-09T10:43:35.163437+00:00'
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
        has only firefox-1538/webkit-2336 as of iteration 24), excluded from batches
        per BUG-1067.'
  fix_iteration: 24
  batches_pending: false
---

# Fix Plan — Iteration 24

## Hypothesis
AC-688 shows as orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips. The AC allows that skip: the host still lacks the WebKit and Firefox builds that the pinned playwright ^1.61.1 needs (firefox-1532, webkit-2311). The XGD coverage gate counts a permitted skip as an orphan (XGD BUG-1696; the sandbox-refused browser install is BUG-1695). No change in the repo can clear it.

## Analysis
- **Quality report REPORT-11815 (report-550bcf9a):** javascript-vitest has 54 passed, 0 failed, 13 deselected. Lint, build and preflight are clean. The only failure is the AC-688 orphan.
- **Changes since iteration 23:** only `.xgd/_changes/*` and the new quality report. No change to source, tests, ACs or dependencies.
- **Environment, re-checked this iteration:** `~/Library/Caches/ms-playwright` holds chromium(-headless-shell) 1228/1234/1243/1248, ffmpeg-1011/1013, firefox-1538 and webkit-2336. The required firefox-1532 and webkit-2311 are still absent.
- **Reference:** `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, the same as the working tree.
- **Builder history:** earlier assessments (report-d973247a, report-dacf5f5d, report-e1a15631, report-721d5131, report-b6efb28f) mark the test `stuck`. They cite the sandbox refusing the browser install (EPERM on the ms-playwright `__dirlock`) and XGD BUG-1695 / BUG-1696. None of them carries an overridable `blocked_by` rule.
- **Hypothesis count:** the same diagnosis has stood for 23 iterations. Per the BUG-1067 stuck-reason rule the test is **not re-batched**.
- **Excluded under BUG-1067:** AC-688 / `tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines` (XGD BUG-1696, environment BUG-1695).
- **Operator action needed to clear it:** run `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox, then re-run the gate for `test_UAT_AC688_`.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- **Batch 0:** asks for no edits. It re-runs the Chromium-only AC-683 round-trip test, which uses the same capture path as AC-688, so the gate keeps checking that evidence. AC-688 is left out (BUG-1067).

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 3.**
  - Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) covers Playwright or browser-engine availability.
  - Rung 2: the reference pins playwright ^1.61.1 (`tools/generate/package.json:21`), the same as the working tree.
  - Rung 3: the tests and the code stand. The orphan is XGD tooling defect BUG-1696 plus the operator-only browser install BUG-1695.