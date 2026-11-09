---
uid: report-cc3ca007
id: REPORT-11750
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:51:39.007552+00:00'
updated_at: '2026-11-09T07:51:39.007552+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: AC-688 test skips (as the AC allows) because the gate host lacks Playwright
      firefox-1532/webkit-2311 for pinned playwright 1.61.1, and XGD coverage gate
      counts the allowed skip as an orphan AC (BUG-1695); no in-repo change clears
      it
    instructions: Verify-only, no edits. List ~/Library/Caches/ms-playwright. If firefox-1532
      and webkit-2311 are now present, run test_UAT_AC688_ and report its real result
      (fix the test only if it then fails on a genuine assertion). If they are still
      absent, report status stuck citing BUG-1695 and the operator action `pnpm --filter
      @1stcontact/generate exec playwright install webkit firefox`. Do not edit production
      code, the Playwright pin, the lockfile, AC-688, or the test skip gate; do not
      retry the install in the sandbox.
    test_scope: test_UAT_AC688_
    ladder:
      rung1: AC-688 is the only intent in scope on this surface and it explicitly
        allows a clean skip when an engine is not installed; no later intent demands
        otherwise.
      rung2: Reference reconcile-src-BUNDLE-43 pins playwright ^1.61.1 (tools/generate/package.json:21)
        with the same skip gate, so it asks for no code or dependency change.
      rung3: 'Decided here: the test stands and the code is not wrong; the blocker
        is environmental (missing firefox-1532/webkit-2311) plus XGD tooling defect
        BUG-1695.'
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 3 decided: the builder proposed no code change and none is warranted.
        AC-688 and its test are correct and the reference needs no change; the failure
        is a missing browser install plus XGD defect BUG-1695, which no production
        edit can fix.'
      files: []
  fix_iteration: 9
---

# Fix Plan — Iteration 9 (re-plan after the blocked_by handoff)

## Hypothesis
AC-688's only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips cleanly as AC-688 allows ("Runs only when all three engines are installed; skips cleanly otherwise"). The cause is that the gate host's Playwright cache still lacks firefox-1532 and webkit-2311, the builds pinned playwright@1.61.1 needs. XGD's coverage gate counts this allowed skip as an orphan AC: XGD tooling defect **BUG-1695**. No code, test or AC change in this story can clear it.

## Analysis
- Scoped quality (report-37999b07): 54 passed, 0 failed, 1 orphan AC (AC-688). Since the last iteration only `.xgd` ticket and change-log files changed.
- Re-checked `~/Library/Caches/ms-playwright` this turn. It holds chromium 1228/1234/1243/1248 (plus their headless shells), ffmpeg 1011/1013, firefox-1538 and webkit-2336. firefox-1532 and webkit-2311 are still absent.
- The test file `tests/reconciliation-l1-substrate.test.ts` gates the test on `engineAvailable('webkit') && engineAvailable('firefox')` (line ~532), which matches AC-688's Verification text. The test is correct and the skip is the AC's own behaviour.
- The previous iteration-9 plan (report-ea05921a) had no batches and so could not rule on the `blocked_by_handoff` report **report-af46bdbc** (rule `code_frozen`, batch 0 of report-e67249b4). That report proposes no change: the builder made no edits and named only the operator install. This plan rules on it by **declining** it.
- Hypothesis history: "the browser builds don't match pinned Playwright 1.61.1, so the operator must install them" has been the diagnosis in iterations 2 through 9. Assessments for iterations 7 and 8 (report-b6efb28f, report-e1a15631) and the latest handoff (report-af46bdbc) are all `stuck` citing BUG-1695. The 3-repeat rule asks for a structurally different hypothesis; none exists in the repo. The only vendored Playwright is 1.61.1, and moving to a version whose browsers.json matches firefox-1538/webkit-2336 would need a network install plus a lockfile change. Rung 2 rules that change out: the reference pins `"playwright": "^1.61.1"` at tools/generate/package.json:21. The sandbox also blocks the install (`__dirlock` permission error).
- **BUG-1067 / BUG-1695:** the stuck reason cites a filed XGD tooling bug. The test is kept in one verify-only batch only because the declined ruling must sit on the batch carrying the blocked test. The batch gives the builder no fix to attempt. If the test is still skipping after this batch, the run ends with this history recorded, as the re-plan rules require.
- **Operator action to clear it** (outside the sandbox, from the repo root): `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`, then re-run `test_UAT_AC688_`.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- **Batch 0** (verify-only, alone): `test_UAT_AC688_no_layout_divergence_across_three_engines`. Ruling on report-af46bdbc: `code_frozen` **declined**. No production file, test or AC edit is warranted. The builder checks the Playwright cache. If firefox-1532 and webkit-2311 are now present, it runs the test and reports its real result. Otherwise it reports `stuck` citing BUG-1695 with no edits.

## Resolution ladder (REQ-938)
- **Batch 0: rung 3 decided.** Rung 1: AC-688 (story-d0a8cfad) is the only intent in scope on this surface, and it explicitly allows a clean skip when an engine is missing. No later intent requires a different outcome. Rung 2: the reference `reconcile-src-BUNDLE-43` pins playwright `^1.61.1` (tools/generate/package.json:21) and has the same skip gate, so it does not ask for a code or dependency change. Rung 3: the test stands and is correct. The code is not wrong, so `code_frozen` is declined. The blocker is environmental plus XGD defect **BUG-1695** (the coverage gate counts an AC-allowed skip as an orphan).
