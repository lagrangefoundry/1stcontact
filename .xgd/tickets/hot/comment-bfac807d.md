---
uid: comment-bfac807d
id: COMMENT-8096
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T10:00:17.388096+00:00'
updated_at: '2026-11-09T10:00:17.388096+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3ef9d15e
  kind: note
---

I filed the iteration 21 fix plan as **REPORT-11801 (report-3ef9d15e)**. It's the same plan as iteration 20, because nothing has changed. More fix iterations won't clear AC-688 until you take one action yourself.

**Why AC-688 still shows as uncovered:**
- **The test skips, it doesn't fail.** Its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, runs only when Chromium, WebKit and Firefox can all launch. The AC allows a skip when they can't.
- **The coverage check counts that skip as "no passing test".** That's the XGD tooling defect earlier iterations cited as BUG-1696; the 54 tests in scope all passed.
- **WebKit and Firefox can't launch on this machine.** Playwright ^1.61.1 needs firefox-1532 and webkit-2311. I checked `~/Library/Caches/ms-playwright` again this iteration and it still has only firefox-1538 and webkit-2336.

**The plan:**
- **AC-688 is left out of every batch.** XGD's rule for stuck tests caused by an XGD tooling bug says not to retry them. I named BUG-1696 in the plan and in the batch's ladder record.
- **One batch, no edits.** It just re-runs AC-683's Chromium-only test, which uses the same capture code, to confirm it stays green.
- **Nothing changes in the repo.** No AC or test edits and no override; bumping Playwright would go against the version pinned in `tools/generate/package.json:21`.

**To clear it**, run this once in a normal terminal (the sandbox blocks the install):
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```
Then re-run the quality check. The other fix would be for XGD's coverage check to count a skip the AC allows as covered (BUG-1696).

The report was created, but the sandbox blocked a connection to `github.com:22` during the same command. That was probably a ticket sync, so the report may only exist locally until a sync succeeds.