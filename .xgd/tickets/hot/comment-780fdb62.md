---
uid: comment-780fdb62
id: COMMENT-8098
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T10:24:39.604325+00:00'
updated_at: '2026-11-09T10:24:39.604325+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b63444d3
  kind: note
---

I filed the iteration 23 fix plan as **REPORT-11811 (report-b63444d3)**. AC-688 will still show as orphaned after this run, because nothing in the repo can fix it.

**Why it's stuck:** AC-688 has only one test, `test_UAT_AC688_no_layout_divergence_across_three_engines`. It runs only when Chromium, WebKit and Firefox can all launch. Playwright 1.61.1 (`tools/generate/package.json:21`) needs firefox-1532 and webkit-2311. I checked your browser cache this iteration and it still has only firefox-1538 and webkit-2336. So the test skips, which the AC allows, but the XGD coverage gate counts that skip as "no passing test."

**What the plan does:**
- **Leaves AC-688 out of the batches.** XGD's own rules say not to retry a test blocked by a filed XGD tooling bug. The bugs here are BUG-1696 (a permitted skip counted as an orphan) and BUG-1695 (the browser install the sandbox refuses).
- **Asks for no edits.** Its one batch re-runs only the Chromium AC-683 test, which uses the same capture path, so that evidence stays checked.
- **Changes nothing else.** The test, the AC and the Playwright pin all stay as they are. Neither the bundled tickets nor the reference ref support bumping Playwright to match one machine's browser cache.

This is the 23rd iteration with the same diagnosis. To clear it, run this from the repo root outside the sandbox:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

Then re-run the gate for `test_UAT_AC688_`.

When the report was filed, the sandbox blocked an outbound connection to `github.com:22`, probably xgd trying to sync. The report itself was created.