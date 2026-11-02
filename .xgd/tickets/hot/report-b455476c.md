---
uid: report-b455476c
id: REPORT-8210
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:42:37.653174+00:00'
updated_at: '2026-11-02T01:42:37.653174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-3a032190.md`: intent/bookkeeping ticket (2e). Kept ours (HEAD). Ours is a strict superset and the later state: updated_at 2026-11-01 vs 2026-09-06, status `bundled` vs `free_coded`, plus `bundled_in: bundle-5052a63c`.
- `.xgd/tickets/hot/request-4a4ca4a1.md`: intent/bookkeeping ticket (2e). Kept ours (HEAD). Ours is later: updated_at 2026-11-01 vs 2026-09-06, status `bundled` vs `free_coding`, plus the commits list, version 0.2.114 and `bundled_in`. story_points is 5 on ours and 3 on incoming; kept 5 from the later state. The body is identical on both sides.
- `.xgd/tickets/hot/request-9bfe910a.md`: intent/bookkeeping ticket (2e). Kept ours (HEAD). Ours is later: updated_at 2026-11-01 vs 2026-09-06, status `bundled` vs `free_coding`, plus a 6-entry commits list, version 0.2.117 and `bundled_in`. The only other difference is a trailing newline at EOF on the incoming side, which is cosmetic.

All three files are outside the sparse cone. Each was resolved with `git checkout --ours` and staged with `git add --sparse`. These are the "more recent commit by timestamp" files the enrichment metadata flagged for post-merge review.

## Incoming changes preserved

No code files were in conflict. The incoming side of each ticket held older (2026-09-06) bookkeeping state, which the HEAD-side bundling for bundle-5052a63c has since superseded. No incoming content was lost; the ticket bodies match apart from a trailing newline.
