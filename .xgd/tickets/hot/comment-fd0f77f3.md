---
uid: comment-fd0f77f3
id: COMMENT-8125
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T15:52:09.422596+00:00'
updated_at: '2026-11-09T15:52:09.422596+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-2f5f1405
  kind: note
---

I filed the iteration 51 fix plan as **report-2f5f1405** (REPORT-11936). It won't clear the AC-688 orphan. Nothing in the repo is wrong, and the run can't fix the real cause from inside its sandbox, so this loop will keep repeating until you act outside it.

**Why AC-688 is orphaned.** Its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, needs Chromium, WebKit and Firefox. When an engine is missing it skips, which the AC explicitly allows. The quality gate counts that allowed skip as "no passing test", which is the known XGD bug BUG-1695.

**Why WebKit and Firefox are missing.** `tools/generate` pins Playwright `^1.61.1`, which expects firefox-1532 and webkit-2311. I checked `~/Library/Caches/ms-playwright` again this time: it still holds only firefox-1538 and webkit-2336, from a different Playwright version. Chromium matches, which is why the Chromium-only AC-683 test passes.

**What the plan does.** It follows iterations 12–50:
- It leaves AC-688 out of the batches; the bug-1067 rule says not to re-batch a test blocked on an XGD tooling bug.
- It runs one check-only batch on AC-687, a validator test that needs no browser.
- It records BUG-1695 so the run's diagnostic report shows it.
- The builder's earlier request to bump Playwright to match the cache stays declined. The reference branch pins the same version, so the bump would only suit this one machine's stale cache.

**Either of these clears it:**
1. Install the matching browsers from your own terminal: `pnpm --filter ./tools/generate exec playwright install webkit firefox`. The builder tried this earlier and the sandbox refused the write to the browser cache.
2. Fix BUG-1695 in XGD so that a skip the AC allows doesn't count as an orphan.

Separately, the sandbox blocked an outbound connection to `github.com:22` while the report was being created, probably XGD trying to push. The report was still created locally.