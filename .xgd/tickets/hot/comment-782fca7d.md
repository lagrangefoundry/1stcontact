---
uid: comment-782fca7d
id: COMMENT-8100
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T10:48:21.018044+00:00'
updated_at: '2026-11-09T10:48:21.018044+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3a03b9bd
  kind: note
---

I filed the iteration 25 fix plan as **REPORT-11821 (report-3a03b9bd)**. AC-688 will still show as orphaned after this run, because nothing in the repo can fix it.

**Why it's stuck:**
- **The only failure is AC-688 with no passing test.** The quality report has 54 tests passed and 0 failed, with lint, build and preflight clean.
- **AC-688 has one test, and it skips.** `test_UAT_AC688_no_layout_divergence_across_three_engines` runs only when Chromium, WebKit and Firefox can all launch.
- **The browsers it needs are still missing.** Playwright is pinned at `^1.61.1` in `tools/generate/package.json:21`, the same at `reconcile-src-BUNDLE-43`, and that version needs firefox-1532 and webkit-2311. I checked the browser cache this iteration and it still has only firefox-1538 and webkit-2336.
- **The AC allows that skip, but the coverage gate doesn't.** XGD's coverage gate counts a skipped test as no coverage (XGD BUG-1696). The sandbox also blocks installing the browsers (BUG-1695).

**What the plan does:**
- **Leaves AC-688 out of the batches**, following XGD's rule for tests blocked by a filed XGD tooling bug (BUG-1067).
- **Asks for no edits.** Its one batch re-runs the Chromium-only `test_UAT_AC683_` test, which uses the same capture path, so that evidence stays checked.
- **Records the ladder as decided at rung 3.** None of the bundled tickets covers browser availability, and the reference ref has the same Playwright pin.

This is the 25th iteration with the same diagnosis, so more iterations won't change it. To clear it, run this from the repo root outside the sandbox:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

Then re-run the gate for `test_UAT_AC688_`.

The sandbox blocked an outbound connection to `github.com:22`, probably xgd trying to sync, but the report was still created. I also left an unused fields file at `.xgd/tmp/fix_plan_25_fields.json`, since the JSON went inline in the command.