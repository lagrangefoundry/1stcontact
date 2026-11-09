---
uid: report-4a22f134
id: REPORT-11806
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T10:12:07.125678+00:00'
updated_at: '2026-11-09T10:19:15.966183+00:00'
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
    hypothesis: AC-688 is orphaned only because its three-engine test cleanly skips
      (as the AC permits) on a host lacking the webkit/firefox builds pinned playwright
      ^1.61.1 needs, and the XGD coverage gate counts that permitted skip as no coverage
      (XGD BUG-1696); no repo change can clear it.
    instructions: Make no edits. This batch only lets the gate re-confirm the Chromium-only
      AC-683 round-trip evidence, which shares the capture path with AC-688. AC-688
      and its test are excluded under the BUG-1067 tooling-defect rule (XGD BUG-1696);
      leave them, engineAvailable, the Playwright pin and the lockfile untouched.
      AC-688 clears only after an operator runs `pnpm --filter @1stcontact/generate
      exec playwright install webkit firefox` outside the sandbox. If the gate shows
      AC-683 red with real failure output, fix from that evidence.
    test_scope: test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or
        browser-engine availability, so rung 1 does not decide.
      rung2: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21
        with the same three-engine skip guard, so the reference asks for no code or
        dependency change.
      rung3: 'Decided at rung 3: tests and code stand; AC-688 orphan status is XGD
        tooling defect BUG-1696 plus a sandbox-refused browser install, excluded from
        batches per BUG-1067.'
  fix_iteration: 22
  batches_pending: false
---

# Fix Plan — Iteration 22

## Hypothesis
AC-688 is orphaned for one reason: its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips, as the AC allows, because the WebKit and Firefox builds that the pinned playwright ^1.61.1 needs are not installed on the host. The XGD coverage gate counts that permitted skip as "no passing test" (XGD tooling defect BUG-1696). No change in the repo can clear it.

## Analysis
- **Quality report REPORT-11805 (report-490d7556):** javascript-vitest has 54 passed, 0 failed, 13 deselected; lint, build and preflight are clean. The only failure is the AC Coverage orphan check on AC-688 (acceptance_criterion-18356eea). In `tests/reconciliation-l1-substrate.test.ts` the test's status is `skipped`, not failed.
- **Changes since iteration 21:** only `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json` and the new quality report. No change to source, tests, ACs, dependencies or the Playwright pin.
- **Environment:** this iteration I could not re-read `~/Library/Caches/ms-playwright`; don't-ask mode refused the read. Iteration 21 recorded firefox-1538/webkit-2336 present and firefox-1532/webkit-2311 (the builds playwright ^1.61.1 needs) absent. The unchanged skip status agrees with that.
- **Outstanding `blocked_by` request:** none. The latest builder assessments report no edits and `blocked_by: null`, so this plan needs no override or `blocked_by` ruling.
- **Hypothesis count:** the same diagnosis has stood for 21 iterations. The blocker is XGD coverage tooling plus a browser install that only an operator can do outside the sandbox. It is not an overridable mode rule. Under BUG-1067 the test is **not re-batched**.
- **Excluded under BUG-1067:** AC-688 / `tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines`, filed as XGD BUG-1696. It clears once an operator runs `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox, or once XGD stops counting a permitted skip as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- **Batch 0 (no edits):** re-runs only the Chromium-only AC-683 round-trip UAT. It shares the capture path with AC-688, so the gate can re-confirm that evidence is green. AC-688 is left out per BUG-1067.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 3.**
  - Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or browser-engine availability.
  - Rung 2: `reconcile-src-BUNDLE-43` pins playwright ^1.61.1 (`tools/generate/package.json:21`) with the same three-engine skip guard, so the reference asks for no change.
  - Rung 3: the tests and the code stand. The AC-688 orphan is XGD BUG-1696 together with a browser install the sandbox refuses.