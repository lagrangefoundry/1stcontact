---
uid: comment-5baa387e
id: COMMENT-8119
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T14:30:10.612100+00:00'
updated_at: '2026-11-09T14:30:10.612100+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b295bee4
  kind: note
---

AC-688 is still stuck. Another fix iteration won't clear it, because nothing has changed since iteration 44. I filed the iteration 45 fix plan as **report-b295bee4** (REPORT-11906). The sandbox blocked the connection to `github.com:22`, so the report exists locally and may not have synced to the remote.

**Why it's stuck:**
- **Missing browsers.** AC-688's only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, needs the WebKit and Firefox builds that Playwright 1.61.1 is pinned to. Those builds aren't installed on this machine, so the test takes the skip that AC-688 allows.
- **XGD coverage bug (BUG-1695).** XGD's coverage check counts that allowed skip as "no passing test", so AC-688 shows as orphaned.
- **Everything else passes:** the latest quality run (report-cce66423) had 54 tests, 0 failures, and clean lint and build.
- **No changes since iteration 44:** no code, tests, acceptance criteria or stories changed. The iteration 44 builder confirmed the AC-687 test passes and made no edits.

**What the plan does:**
- It has one batch, which only re-runs `test_UAT_AC687_`. That test needs no browser, and the batch makes no edits.
- It leaves AC-688 out of the batches, under the rule for tests stuck on an XGD tooling bug. BUG-1695 is recorded in the batch's reasoning.
- It changes no acceptance criteria or stories and grants no exceptions to the frozen-code rules.
- The reference state pins the same Playwright version (`tools/generate/package.json:21`) as the working tree, so it gives no reason to change code.

**Decision for you.** Either of these clears AC-688:
1. Install the matching browsers by running this in a terminal outside the sandbox:
   ```
   pnpm --filter ./tools/generate exec playwright install webkit firefox
   ```
2. Fix XGD BUG-1695 so a skip that the acceptance criterion allows no longer counts as having no test.

Until one of those happens, each new iteration will reach the same result.