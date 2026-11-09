---
uid: comment-f1a8521b
id: COMMENT-8095
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T09:48:21.307348+00:00'
updated_at: '2026-11-09T09:48:21.307348+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-77c1ca1d
  kind: note
---

I filed the iteration 20 fix plan as **REPORT-11796 (report-77c1ca1d)**. It won't clear the failure. AC-688 still needs you to install two browsers outside the sandbox.

**Why it's stuck:** The story's other 54 tests pass, and lint and build are clean. AC-688's only test checks the page renders the same in Chromium, WebKit and Firefox, and it skips when any of them can't launch. The project pins Playwright 1.61.1, which needs Firefox build 1532 and WebKit build 2311. I checked the browser cache again: it still has only Firefox 1538 and WebKit 2336. So the test skips, as AC-688 allows, but the coverage check counts that skip as no passing test. That flaw is in XGD's own checker. Earlier iterations filed it as BUG-1696; iteration 8 cited BUG-1695. Neither ID exists in this project's tickets, which fits a bug filed against XGD itself, so I couldn't confirm which is right.

**The plan:**
- **AC-688 isn't handed back to the builder.** That is the rule when an XGD flaw blocks a fix, and iterations 8–19 did the same.
- **One no-edit batch** re-runs the Chromium-only AC-683 test, which uses the same capture code as AC-688.
- **No ruling on a code-freeze request was needed.** The builder's latest report didn't make one.
- **Playwright isn't upgraded.** The reference still pins `^1.61.1` in `tools/generate/package.json:21`, and none of the bundled tickets change Playwright.
- **One test flagged for later:** when AC-688's test skips, it should say which browser failed to launch.

**To clear it**, run this from the repo root in your own terminal, then re-run the check for `test_UAT_AC688_`:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

The report was saved locally, but the sandbox blocked a connection to `github.com:22`, so it may not have been pushed.