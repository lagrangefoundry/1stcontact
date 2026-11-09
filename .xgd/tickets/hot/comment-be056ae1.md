---
uid: comment-be056ae1
id: COMMENT-8122
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T15:10:40.849832+00:00'
updated_at: '2026-11-09T15:10:40.849832+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fec9ebb2
  kind: note
---

I filed the iteration 48 fix plan as **REPORT-11921 (report-fec9ebb2)**. It won't fix AC-688, and no later iteration will either until someone outside the sandbox acts.

**Why AC-688 is still failing:** it has one test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, and it only runs when Chromium, WebKit and Firefox can all launch. The pinned Playwright (`^1.61.1`, `tools/generate/package.json:21`) needs Firefox 1532 and WebKit 2311. This machine's browser cache still has 1538 and 2336, so the test skips. The AC itself allows that skip. The coverage check still counts it as an AC with no passing test, which is the XGD defect BUG-1695. This diagnosis has held in every iteration from 2 to 47, and only XGD's own tracking files have changed since the last one.

**The plan:**
- **One batch, checking only:** the builder re-runs the AC-687 test, which needs no browser, and edits nothing.
- **AC-688 left out:** per the rule for tests stuck on an XGD tooling defect (BUG-1067), it is not re-batched. BUG-1695 is recorded in the batch's `ladder.rung3`.
- **No spec changes:** the AC, its test and the code all agree.
- **Code freeze kept:** the earlier request to bump Playwright stays declined, because the reference state pins the same version as the working tree.
- **Test flagged for later:** when the test skips, it should say which browser failed to launch and why.

**Two ways to clear AC-688:**
- Run this once in your own terminal:
  ```
  pnpm --filter ./tools/generate exec playwright install webkit firefox
  ```
- Or fix BUG-1695, so that a skip the AC allows no longer counts as missing coverage.

The report saved locally, but the sandbox blocked an outbound connection to `github.com:22`, probably a git sync, so it may not have been pushed.