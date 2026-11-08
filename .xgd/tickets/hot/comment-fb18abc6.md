---
uid: comment-fb18abc6
id: COMMENT-7997
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-08T11:51:06.457246+00:00'
updated_at: '2026-11-08T11:51:06.457246+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e42de3cc
  kind: note
---

I've fixed the one gap that failed the review: AC-1492 had been retired with nothing replacing it. I didn't run the tests, per the fixer instructions; the workflow runs the full suite next.

- **New AC:** I created **AC-2412** (`acceptance_criterion-7dcc23b9`) under STORY-128 (`story-e07c589b`). It repeats AC-1492 word for word, except that "where it came from" now also allows `generated`. Its body opens "Replaces AC-1492, whose origin vocabulary REQ-208 … extended", the same pattern AC-2409 used for AC-2337. AC-1492 itself is still `superseded`, unchanged.
- **Test (commit `97ab3d1192`):** in `tests/reconciliation-material-types.workers.test.ts`, the UAT is now named `test_UAT_AC2412_…`. I added `'generated'` to `ORIGINS`, so the test now checks that both a material and a reference accept `origin: generated` and read it back unchanged. I also fixed the matching code comment ("two of the five").
- **Production code:** no change needed. `tickets.ts:89` already accepts `generated` on both kinds.
- **FC orphans:** none to handle; there is no fc_orphan_check report for this anchor.
- **Not done:** the review's optional item 2 (matching vendor names regardless of case in the AC-2380 test). The review said it was not a cause of the FAIL.
- **Report:** filed as REPORT-11420 (`report-e42de3cc`) with `progress_made=true, needs_more_work=false`.

The ticket-store commits were saved locally, but the sandbox blocked their push to github.com:22.