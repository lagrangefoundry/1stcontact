---
uid: comment-44db23be
id: COMMENT-8088
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T08:20:41.145409+00:00'
updated_at: '2026-11-09T08:20:41.145409+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-194952c7
  kind: note
---

AC-688 will keep failing until you install two browsers, which only you can do. Run this once from a normal terminal:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

I filed the iteration 13 fix plan as **REPORT-11761 (report-194952c7)**. It has not been through the plan check yet.

**Why it still fails:** AC-688's test runs only when Chromium, WebKit and Firefox can all start, and the AC says it should skip otherwise. Playwright 1.61.1 needs WebKit 2311 and Firefox 1532. The browser cache on this machine still has only WebKit 2336 and Firefox 1538; I checked again this iteration. So the test skips, and the quality check counts that skip as AC-688 having no test. The test, the AC and the code are all correct.

**The plan:**
- **AC-688's test is left out again**, as in iteration 12. Eleven earlier rounds sent it to the builder and none produced an edit. The plan records the XGD bug about the quality check, BUG-1696, filed in iteration 12. `xgd ticket get BUG-1696` returns "not found" in this project's tracker, presumably because it was filed in XGD's own tracker; I didn't confirm it exists there.
- **The only batch makes no edits.** It just keeps the Chromium-only AC-683 test in the check run. That test passed in the latest quality run, which had 54 passes and 0 failures. Chromium can't start inside the builder's sandbox, so the builder will only see it skip; the real result comes from the check run.
- **Playwright stays at `^1.61.1`.** The reference version of `tools/generate/package.json:21` has the same pin, and none of the five bundled tickets asks for a different version. I changed no ACs.
- **Test flagged for later:** when AC-688's test skips, it doesn't say which browser failed to start. Having it record that would make the next report point straight at the missing browser.

The first filing attempt failed because I passed `--stdin`; the retry without it worked. The sandbox again blocked an outbound connection to `github.com:22`, probably a git sync, but the report was created locally.