---
uid: comment-4d3a83ec
id: COMMENT-8114
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T13:28:41.198165+00:00'
updated_at: '2026-11-09T13:28:41.198165+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8d636652
  kind: note
---

I filed the iteration 40 fix plan as **REPORT-11881 (report-8d636652)**. AC-688 is still uncovered, and running more fix iterations won't change that: two browsers have to be installed by hand.

**Why it's stuck:** AC-688's only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, needs Chromium, WebKit and Firefox to launch. The AC allows the test to be skipped when one can't. The pinned Playwright 1.61.1 needs firefox-1532 and webkit-2311. I checked `~/Library/Caches/ms-playwright` again just now and it still has only firefox-1538 and webkit-2336. The coverage gate then counts that allowed skip as an uncovered AC, which is XGD bug BUG-1695. The rest of the quality run is clean: lint, build and preflight pass, and all 54 tests pass. Nothing in the repo has changed since iteration 39.

**The plan:**
- **No edits.** It has one batch, which only re-runs `test_UAT_AC687_` to confirm it still passes. That test checks the validator and doesn't need a browser.
- **AC-688's test is left out.** The rules say a test blocked by an XGD bug is not re-batched. BUG-1695 is recorded against it in the batch.
- **The code freeze stays.** The earlier request to lift it stays declined, because the reference branch pins `playwright ^1.61.1` at `tools/generate/package.json:21` and none of the bundled tickets ask to change it.

**To clear AC-688,** run this from a normal terminal, since the sandbox can't download the browsers:
```
pnpm --filter ./tools/generate exec playwright install webkit firefox
```
Fixing BUG-1695 so an allowed skip isn't counted as uncovered would also clear it.

The report is saved locally, but it may not have reached the remote: the sandbox blocked xgd's connection to `github.com:22` while it was filing.