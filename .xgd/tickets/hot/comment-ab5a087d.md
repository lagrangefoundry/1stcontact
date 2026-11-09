---
uid: comment-ab5a087d
id: COMMENT-8110
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T12:40:03.985066+00:00'
updated_at: '2026-11-09T12:40:03.985066+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8937696a
  kind: note
---

I filed the iteration 36 fix plan as **REPORT-11861 (report-8937696a)**. Iterations 1–35 haven't moved AC-688, and this one won't either: nothing inside the repo or the sandbox can clear it.

**Why AC-688 is still orphaned:** its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips unless Chromium, WebKit and Firefox can all launch. The AC allows that skip. The test keeps skipping because the browser cache on this machine doesn't match the pinned Playwright:

| | Playwright 1.61.1 needs | Cache on this machine has |
|---|---|---|
| Firefox | revision 1532 | revision 1538 |
| WebKit | revision 2311 | revision 2336 |

XGD's coverage gate then counts the allowed skip as an orphan (XGD bug BUG-1695).

**The plan:**
- **No repo changes.** The reference ref still pins `"playwright": "^1.61.1"` in `tools/generate/package.json`, the same as the working tree. So bumping Playwright to match one machine's cache is ruled out.
- **AC-688 is left out of the batches**, as the BUG-1067 rule requires, and BUG-1695 is recorded in the ladder.
- **The one batch is a check only:** run AC-687's test, which needs no browser, confirm it still passes, and make no edits.
- **One test flagged for later:** when AC-688's test skips, it should say which browser failed to launch and why.

**To clear AC-688**, run this once from a normal terminal outside the sandbox:
```
pnpm --filter ./tools/generate exec playwright install webkit firefox
```
Fixing BUG-1695 in XGD would also clear it. Until one of those happens, more iterations will give the same result.

When the report was filed, the sandbox blocked an outbound connection to `github.com:22`, probably an automatic git sync. The report was still created; it may not have been pushed.