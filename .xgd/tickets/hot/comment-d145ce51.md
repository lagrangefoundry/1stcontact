---
uid: comment-d145ce51
id: COMMENT-8120
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T14:42:45.018677+00:00'
updated_at: '2026-11-09T14:42:45.018677+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4fb0d034
  kind: note
---

I filed the iteration 46 fix plan as **REPORT-11911** (report-4fb0d034). It won't clear the failure: AC-688 stays orphaned until two things are fixed outside this run.

- **Why AC-688 is orphaned:** its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips because WebKit and Firefox won't launch. The pinned Playwright 1.61.1 needs firefox-1532 and webkit-2311, but this machine only has firefox-1538 and webkit-2336. AC-688 itself says the test "skips cleanly otherwise", but XGD's coverage check counts that skip as no passing test (XGD BUG-1695).
- **Nothing has changed:** iterations 2 through 45 found the same cause. Since iteration 45 the only changes are XGD's own change-tracking files and the quality report. All 54 tests in scope pass, and lint and build are clean.
- **What the plan does:** following the rule for faults in XGD's own tooling, it leaves AC-688 out of the batch and names BUG-1695 in the ladder. The one batch only re-runs `test_UAT_AC687_`, which needs no browser, with no edits. No AC or story changes and no mode overrides; the builder raised no blocks to rule on.
- **Ladder:** rung 3 decides. No intent in scope asks AC-688 to pass without its skip. The reference pins the same Playwright version (`tools/generate/package.json:21`), so the tests stand and no code change follows.

**To clear it you need to:**
1. Run `pnpm --filter ./tools/generate exec playwright install webkit firefox` on the gate machine. The sandbox blocks the download and the write to `~/Library/Caches/ms-playwright`.
2. Fix XGD BUG-1695 so that a skip the AC allows isn't reported as an orphan.

The report was created, but the sandbox logged a blocked outbound connection to `github.com:22` during the `xgd report create` call. If xgd tries to sync reports to GitHub, that sync may not have happened.