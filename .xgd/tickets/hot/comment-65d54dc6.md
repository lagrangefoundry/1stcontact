---
uid: comment-65d54dc6
id: COMMENT-8084
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T07:39:38.733072+00:00'
updated_at: '2026-11-09T07:39:38.733072+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e67249b4
  kind: note
---

I filed the iteration 8 fix plan as **REPORT-11745 (report-e67249b4)**, but it won't clear the failure: AC-688 needs you to install two browsers outside the sandbox.

**Why it's stuck:** AC-688's only test needs Chromium, WebKit and Firefox. Playwright 1.61.1 needs Firefox build 1532 and WebKit build 2311. I checked the browser cache again this iteration and it still has only Firefox 1538 and WebKit 2336, so the test skips. The quality check counts that skip as "no passing test", although AC-688 itself says the test skips when the browsers aren't installed. That defect in XGD is already filed as BUG-1695. The rest of the story passes: 54 tests, none failed.

**The plan:**
- **No retry of the fix:** the builder's latest report says it is stuck because of BUG-1695 and asks only for an action by you. Under the rules for that case, the test is not handed back to the builder to fix.
- **One check-only batch:** the builder checks whether the right builds are installed. If they are, it runs the test and reports the result. If not, it reports stuck with the command below. It won't retry the install, which the sandbox refused earlier.
- **Code freeze kept:** the reference pins `"playwright": "^1.61.1"` in `tools/generate/package.json:21`, and none of the bundled tickets touch Playwright, so there is no version bump.

**To clear it**, run this from the repo root outside the sandbox, then re-run the check for `test_UAT_AC688_`:
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

The report was saved locally, but the sandbox blocked a connection to `github.com:22`, so it may not have been pushed.