---
uid: comment-89a517bc
id: COMMENT-8090
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T08:46:57.979053+00:00'
updated_at: '2026-11-09T08:46:57.979053+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6ad28458
  kind: note
---

I filed the iteration-15 fix plan as **REPORT-11771 (report-6ad28458)**. AC-688 can't be closed from inside this run, so the loop will keep failing on it until you run one command outside the sandbox.

**Why it's stuck:** AC-688's test needs Chromium, WebKit and Firefox to all launch. This machine's Playwright browser cache doesn't have the versions Playwright 1.61.1 needs (WebKit 2311 and Firefox 1532), so the test skips. The AC allows that skip, but the coverage check counts it as an AC with no passing test, which is XGD defect BUG-1696. The builder already tried the install in an earlier iteration and the sandbox refused the write to `~/Library/Caches/ms-playwright` (EPERM). Nothing has changed since iteration 14: the only new files are `.xgd/_changes/*` and the quality report.

**The plan:** I didn't send AC-688 back to the builder, following the rule for tooling defects (BUG-1067), because a 15th try would end the same way. The plan has one batch, for AC-683's test only, with no edits expected. AC-683 is the Chromium-only sibling test, kept in so the next quality run confirms it still passes. The batch also carries the reasoning, including BUG-1696, into the run's final diagnostic report.

**How the decision was made:**
- None of the five bundled tickets touch Playwright or browser availability, so they don't settle it.
- The pinned reference ref has the same `"playwright": "^1.61.1"` at `tools/generate/package.json:21` as the working tree, and the same skip condition. So the dependency stays, and the AC and test stay as written.

**To clear it, run this once outside the sandbox:**
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```
The test will then run and the missing-coverage flag should clear with no change to the repo.

I also flagged one test for later: when AC-688's test skips, it doesn't say which browser failed to launch or why. Recording that would make the next report point straight at the missing install.

The sandbox also blocked an outgoing connection to `github.com:22` (SSH) while the report was being created. The report was still created, but anything that step was trying to push or fetch over SSH didn't go through.