---
uid: comment-1aa7fa51
id: COMMENT-8091
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T08:59:29.473334+00:00'
updated_at: '2026-11-09T08:59:29.473334+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dafbcf3b
  kind: note
---

I filed the iteration-16 fix plan as **REPORT-11776 (report-dafbcf3b)**. The run will keep failing on AC-688 until you run one command outside the sandbox.

**Why it still fails:** AC-688's test needs Chromium, WebKit and Firefox to launch. Playwright 1.61.1 needs WebKit 2311 and Firefox 1532, and this machine's browser cache doesn't have them, so the test skips. The AC allows that skip, but XGD's coverage check counts it as an AC with no passing test, which is the tooling defect BUG-1696. Every other test passes (54 of 54). Nothing has changed since iteration 15, and a builder already tried the install in iteration 2: the sandbox refused the write to the browser cache.

**The plan:** I left AC-688 out of the batches, because sending it back to the builder would fail the same way. The one batch covers AC-683's test, the Chromium-only sibling, with no edits expected; it's there so the next run confirms that test still passes. None of the five bundled tickets touch Playwright, and the reference ref pins `"playwright": "^1.61.1"` (`tools/generate/package.json:21`) the same as the working tree. So the AC, its test and the dependency all stay as written. The plan records BUG-1696 so the run's final diagnostic report will name it.

**To clear it, run this once outside the sandbox:**
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```
The test will then run, and AC-688 should no longer be flagged as missing coverage, with no change to the repo.

When filing the report, the sandbox also blocked a connection to `github.com:22`. The report was still created, but anything xgd tried to push to GitHub at that point may not have gone through.