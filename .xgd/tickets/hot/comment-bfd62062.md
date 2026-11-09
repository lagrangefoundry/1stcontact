---
uid: comment-bfd62062
id: COMMENT-8123
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T15:24:36.928496+00:00'
updated_at: '2026-11-09T15:24:36.928496+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ca31830a
  kind: note
---

I filed the iteration 49 fix plan as **REPORT-11926 (report-ca31830a)**. It won't fix AC-688, and no further iteration will either. One command from you, run outside the sandbox, will.

**Why it keeps failing:** AC-688 has one test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, and it runs only when Chromium, WebKit and Firefox can all launch. The project's Playwright (`^1.61.1`, `tools/generate/package.json:21`) needs Firefox 1532 and WebKit 2311. I checked the browser cache again: it still has only Firefox 1538 and WebKit 2336, so the test skips. The AC itself allows that skip, but the coverage check counts a skipped test as "no passing test". All 54 scoped tests pass, and the AC, the test and the code agree with each other.

**The plan:**
- **One batch, check only:** the builder runs the AC-687 test, which needs no browser, and edits nothing.
- **AC-688 left out:** XGD's rule for tests stuck on an XGD tooling defect (BUG-1067) says not to send them back to the builder. Sending it back already produced the same result in iterations 2 to 11.
- **No spec changes.** The earlier request to bump Playwright stays declined, because the reference version pins the same Playwright as the working tree.

**To clear it, run this once in your own terminal:**
```
pnpm --filter ./tools/generate exec playwright install webkit firefox
```
The test will then run instead of skipping, with no change to the repo. The other way out is to fix the XGD defect that counts an allowed skip as missing coverage.

**Things to know:**
- **BUG-1695 isn't in this project's tickets.** The plan cites it because earlier plans say it was filed against XGD itself, but I couldn't confirm that. Earlier iterations also cited BUG-1696 and BUG-1697 for the same problem, so you may want to settle on one.
- **The report may not have been pushed.** It saved locally, but the sandbox blocked an outgoing connection to `github.com:22`, probably a git sync.