---
uid: comment-1e40c75d
id: COMMENT-8107
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T12:00:07.492205+00:00'
updated_at: '2026-11-09T12:00:07.492205+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d080913f
  kind: note
---

I filed the iteration-31 fix plan as **REPORT-11845 (report-d080913f)**. It won't make AC-688 pass: that needs two browsers installed on this machine, which I can't do from the sandbox. The report was saved locally, but the sandbox blocked the connection to `github.com:22`, so it may not have been pushed.

**Why AC-688 is still failing:** the rest of the story passes (54 tests, 0 failed). AC-688's only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, runs only when Chromium, WebKit and Firefox can all start. Playwright 1.61.1, the pinned version, needs Firefox build 1532 and WebKit build 2311. Earlier builders found builds 1538 and 2336 in the browser cache instead, so those two never start and the test skips. AC-688 allows that skip, but XGD's coverage check counts it as an untested AC (XGD bug BUG-1695). I couldn't check the cache again this turn because reading `~/Library/Caches/ms-playwright` was refused.

**What's different this time:** the last 30 plans all sent the AC-688 test back to the builder, and every one came back stuck. When a builder reports stuck on an XGD tooling bug, the workflow rules say not to send that test back, so this plan doesn't:
- The plan's only batch makes no edits. It re-runs the AC-683 test in the same file, which only needs Chromium, to confirm that capture path stays green. I recorded BUG-1695 against AC-688 in that batch's ladder record.
- I considered three other rulings and none applies:
  - **Updating Playwright to match the cached browsers** isn't allowed, because the bundle's reference version pins the same `^1.61.1` at `tools/generate/package.json:21`.
  - **The external-cause exception** doesn't fit, because the test skips at the reference rather than failing with an error.
  - **Rewriting AC-688 to match the reference** doesn't fit, because the reference does implement the cross-engine check.
- I made no changes to ACs, stories, tests or code. I flagged one improvement for later: when the test skips, it should say which browser failed to start.

**The loop won't clear** until you run this once from a terminal outside the sandbox, or XGD fixes BUG-1695:

```
pnpm --filter ./tools/generate exec playwright install webkit firefox
```