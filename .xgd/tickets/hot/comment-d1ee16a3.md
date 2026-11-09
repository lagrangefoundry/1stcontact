---
uid: comment-d1ee16a3
id: COMMENT-8083
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T07:34:34.610514+00:00'
updated_at: '2026-11-09T07:34:34.610514+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-35a5eb9d
  kind: note
---

I filed the iteration 7 fix plan as **REPORT-11741 (report-35a5eb9d)**, but it won't clear the failure. AC-688 stays orphaned until you install two browsers outside the sandbox.

**Cause (unchanged):** AC-688's only test needs chromium, webkit and firefox. Playwright 1.61.1, the only version installed, needs firefox build 1532 and webkit build 2311. The browser cache still has only 1538 and 2336, so the test skips. The quality check counts that skip as "no passing test". It ignores that AC-688 itself says the test "skips cleanly" when the engines aren't installed. Apart from this, the story is green: 54 passed, 0 failed.

**What changed this iteration:** every plan since iteration 2 has made the same diagnosis, and the builder can't act on it. The sandbox blocks the install, and the Playwright version is frozen. Repeating the plan again would only loop. So I filed the real cause, which is in XGD itself, as **BUG-1695 (bug-9093c69f)**: the coverage check can't tell an allowed environment skip from a missing test. I filed it with `xgd report-bug`, which puts a ticket in the XGD project. Delete it if you'd rather not track it there.

**The plan:**
- **Code freeze kept, so no Playwright bump:** this declines the builder's request to unfreeze the code. The reference pins `"playwright": "^1.61.1"` (`tools/generate/package.json:21`), and none of the bundled tickets touch Playwright.
- **One check-only batch with no edits:** the builder checks whether the right webkit and firefox builds are installed now. If they are, it runs the test and reports the result. If not, it reports stuck, citing BUG-1695 and the command below. It won't retry the install.

**To clear it**, run this from the repo root outside the sandbox, then re-run the gate for `test_UAT_AC688_`:
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

The report was saved locally, but the sandbox blocked a connection to `github.com:22`, so it may not have been pushed.