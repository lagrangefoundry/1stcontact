---
uid: comment-054bab66
id: COMMENT-8111
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T12:52:19.531483+00:00'
updated_at: '2026-11-09T12:52:19.531483+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4841fd13
  kind: note
---

AC-688 is still orphaned for the same reason as in the last 36 iterations, and nothing in the repo or this sandbox can clear it. I filed the iteration 37 fix plan as **REPORT-11866 (report-4841fd13)**.

**Why it's stuck:** AC-688's only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, runs only if Chromium, WebKit and Firefox all launch, and skips otherwise. The AC allows that skip. The browsers on this machine don't match the Playwright version the repo pins:

| | Playwright 1.61.1 needs | Cache on this machine has |
|---|---|---|
| Firefox | revision 1532 | revision 1538 |
| WebKit | revision 2311 | revision 2336 |

So WebKit and Firefox never launch, the test skips, and XGD's coverage check counts the allowed skip as an orphan (XGD bug BUG-1695). The quality run is otherwise clean: 54 tests passed, 0 failed, and lint and build are green.

**The plan:**
- **AC-688 is left out of the batches**, as the BUG-1067 rule requires, and BUG-1695 is recorded in the ladder.
- **No repo changes.** The reference ref still pins `"playwright": "^1.61.1"` at `tools/generate/package.json:21`, the same as the working tree, so the plan doesn't bump Playwright.
- **The one batch is a check only:** re-run AC-687's test, which needs no browser, and make no edits.
- **One test flagged for later:** when AC-688's test skips, it should say which browser failed to launch and why.

I couldn't confirm the browser cache myself, because the sandbox blocked reading `~/Library/Caches/ms-playwright`. The revision numbers come from the builder's last report. Nothing in the repo has changed since iteration 36.

**To clear AC-688**, run this once from a normal terminal:
```
pnpm --filter ./tools/generate exec playwright install webkit firefox
```
Fixing BUG-1695 in XGD would also clear it. Until one of those happens, each new iteration will end the same way.

While filing the report, the sandbox blocked an outbound connection to `github.com:22`, probably an automatic git sync. The report was created, but it may not have been pushed.