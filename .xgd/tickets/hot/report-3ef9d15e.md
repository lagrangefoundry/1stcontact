---
uid: report-3ef9d15e
id: REPORT-11801
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T10:00:07.879586+00:00'
updated_at: '2026-11-09T10:07:24.022866+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 21
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: AC-688 is orphaned only because its three-engine test cleanly skips
      (as the AC permits) on a host whose Playwright cache has firefox-1538/webkit-2336
      instead of the firefox-1532/webkit-2311 that pinned playwright ^1.61.1 needs,
      and the XGD coverage gate counts that permitted skip as no coverage (XGD BUG-1696);
      no repo change can clear it.
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
        with the same three-engine skip guard as the working tree, so the reference
        asks for no code or dependency change.
      rung3: 'Decided at rung 3: tests and code stand; AC-688 orphan status is XGD
        tooling defect BUG-1696 plus a sandbox-refused browser install (~/Library/Caches/ms-playwright
        still has only firefox-1538/webkit-2336 at iteration 21), excluded from batches
        per BUG-1067.'
  batches_pending: false
---

# Fix Plan — Iteration 21

## Hypothesis
AC-688 is orphaned for one reason: its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips, as the AC allows. It skips because the host's `~/Library/Caches/ms-playwright` still has firefox-1538 and webkit-2336, not the firefox-1532 and webkit-2311 that the pinned playwright ^1.61.1 needs. The XGD coverage gate counts that permitted skip as "no passing test" (XGD tooling defect BUG-1696). No change in the repo can clear it.

## Analysis
- **Quality report REPORT-11800 (report-b590cb62):** 54 passed, 0 failed, 13 deselected; lint, build and preflight clean. The only failure is the orphan-AC check on AC-688 (acceptance_criterion-18356eea). The test's status is `skipped`, not failed.
- **Changes since iteration 20:** only `.xgd/_changes/*` and the new quality report. No source, test, AC, dependency or environment change.
- **Environment, re-checked this iteration:** `~/Library/Caches/ms-playwright` has chromium-1228/1234/1243/1248, firefox-1538 and webkit-2336. It still has no firefox-1532 or webkit-2311, so `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts`) returns false for webkit and firefox, and the test's three-engine guard skips it.
- **Outstanding `blocked_by` request:** none. The latest builder assessments report no edits with `blocked_by: null`, so this plan needs no override or `blocked_by` ruling.
- **History:** iterations 1–20 all reach the same diagnosis. The sandbox refused the builder's install attempt (EPERM on the browser cache). Since iteration 8, AC-688 has been excluded under the BUG-1067 tooling-defect rule.
- **Hypothesis count:** far more than 3. The blocker is XGD coverage tooling plus a browser install only an operator can do, not an overridable mode rule. Under BUG-1067, AC-688 is **not re-batched**.
- **Excluded under BUG-1067:** AC-688 / `tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines`, XGD BUG-1696. Earlier iterations also cited BUG-1695; BUG-1696 is the consistent recent citation.
- **Rejected alternatives (unchanged):**
  - Bumping Playwright to match the stale cache contradicts the reference pin at `tools/generate/package.json:21`, and no intent in scope asks for it.
  - An engine-free rewrite of the test would be false evidence.
  - Superseding AC-688 would drop real behaviour that the reference keeps.
- **Operator action that clears it** (outside the sandbox): `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`, then re-run the gate for `test_UAT_AC688_`.
- **Note for the run:** iterations 20 and 21 have identical inputs and identical outcomes. Running more fix iterations cannot converge until the operator action above is taken or the XGD gate treats a skip the AC permits as coverage (BUG-1696).

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation — when it skips, the reason should name which engine failed to launch and the expected and found revisions, so reports point straight at the missing browser.

## Batches
- **Batch 0 (keep-green, no edits):** AC-683's Chromium-only round-trip test shares the capture path with AC-688. This batch lets the gate re-confirm it and carries the BUG-1696 record in `ladder.rung3`. AC-688 is deliberately left out of all batches.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 3:**
  - Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or browser-engine availability.
  - Rung 2: `reconcile-src-BUNDLE-43` pins playwright ^1.61.1 at `tools/generate/package.json:21` and has the same three-engine skip guard as the working tree, so the reference asks for no change.
  - Rung 3: the tests and code stand. AC-688's orphan status is XGD tooling defect BUG-1696 plus a browser install the sandbox refuses, so it is excluded per BUG-1067.