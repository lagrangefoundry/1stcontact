---
uid: comment-c449a060
id: COMMENT-8108
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T12:15:44.200164+00:00'
updated_at: '2026-11-09T12:15:44.200164+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6b74c96b
  kind: note
---

I filed the iteration 34 fix plan as **REPORT-11851** (report-6b74c96b), but it won't clear AC-688. Only you can, from a terminal outside the sandbox:

```
pnpm --filter ./tools/generate exec playwright install webkit firefox
```

**Why AC-688 is still failing:** it's the only failure, and the cause has been the same since iteration 1. Its one test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, runs only when Chromium, WebKit and Firefox can all launch. On this machine WebKit and Firefox can't: Playwright 1.61.1 needs firefox-1532 and webkit-2311, but the browser cache holds firefox-1538 and webkit-2336. So the test skips, which the AC allows ("skips cleanly otherwise"). The coverage check then counts that skip as having no passing test. That counting behaviour is a known XGD bug, BUG-1695. The other 54 tests pass.

**What the plan does:**
- **AC-688's test is left out of the batches.** Iterations 31–33 did the same: an XGD tooling bug is behind it, so retrying can't change the result. BUG-1695 is recorded in the batch's resolution-ladder notes.
- **No code or dependency change.** Bumping Playwright to match the cached browsers was rejected because the reference branch pins `playwright ^1.61.1` (`tools/generate/package.json:21`), the same as now. The exception for causes outside the repo doesn't apply either, because it requires the test to fail at the reference, and there it skips.
- **The iteration 33 plan was refused for wording.** Its instructions named the frozen production files, even though only to say "don't touch", and the validator read that as an edit without permission. This plan names no production files.
- **The verification test is now AC-687 instead of AC-683.** AC-683 needs Chromium, which can't launch in the builder's sandbox (BUG-1685), so it could never be confirmed there. AC-687 is in the same test file and needs no browser.

Fixing BUG-1695 would also clear AC-688. The report was saved locally, but the sandbox blocked xgd's connection to `github.com:22`, so it may not have been pushed to the remote.