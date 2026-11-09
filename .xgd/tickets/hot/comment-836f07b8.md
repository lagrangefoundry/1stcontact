---
uid: comment-836f07b8
id: COMMENT-8089
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T08:34:13.288272+00:00'
updated_at: '2026-11-09T08:34:13.288272+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f6f84624
  kind: note
---

AC-688 won't clear until you install two browsers outside the sandbox. Nothing in the repo is wrong, and no step of this run can do the install. Run this once from a normal terminal at the repo root:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

The fix plan for iteration 14 is filed as REPORT-11766 (report-f6f84624). It changes no tickets, acceptance criteria or files.

**Why it keeps failing:** AC-688's test needs Chromium, WebKit and Firefox all to start, and the AC itself says to skip otherwise. Playwright 1.61.1 needs WebKit 2311 and Firefox 1532, but your browser cache has 2336 and 1538. So the test skips, and the quality check counts that skip as AC-688 having no passing test. When the builder tried the install in an earlier round, the sandbox refused the write to `~/Library/Caches/ms-playwright`. I couldn't check the cache myself this time because the session refused reads there. The latest quality run still shows the skip, so it hasn't changed.

**What the plan does:**
- **AC-688 is left out of the batches.** Iterations 1–11 retried it with no result, and 12–13 already took this route with the XGD bug BUG-1696, about the check counting an allowed skip as missing coverage. The previous planner noted BUG-1696 isn't in this project's tracker and didn't confirm where it was filed.
- **The one batch makes no edits.** It only keeps the Chromium-only AC-683 test green, which it was in the last run (54 passed, 0 failed).
- **Earlier plans overstated the version pin.** `tools/generate/package.json:21` allows any 1.x from `^1.61.1` up; it's the lockfile that fixes 1.61.1. So instead of installing browsers, you could update the lockfile to the Playwright 1.x release that matches the browsers you already have. That also needs network access, so I didn't let the builder lift the code freeze for it.

The sandbox also blocked an outbound connection to `github.com:22` while I filed the report. The report was still created.