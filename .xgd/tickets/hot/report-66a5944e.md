---
uid: report-66a5944e
id: REPORT-8059
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:48:51.762240+00:00'
updated_at: '2026-11-02T00:48:51.762240+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-920e1a2c.md`: AA (both added), intent/bookkeeping ticket. Rule 2b/2e (keep the strict superset) → kept HEAD (ours).
  - Incoming `ff959601a0` ("create request request-920e1a2c", 2026-09-05) is the original draft creation of the ticket: status `draft`, story_points 2, links to REQ-135/REQ-136.
  - HEAD holds the same ticket further along (updated 2026-11-01): status `bundled`, `bundled_in: bundle-5052a63c`, story_points 3, a chat_comment, two working commits, version 0.2.98, links renumbered to REQ-197/REQ-198, and the full "What landed" section.
  - The only lines the incoming side has that HEAD lacks are older values of fields HEAD later changed (status, updated_at, story_points, the REQ link renumbering). The incoming side adds no fact of its own, so HEAD is the superset.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only effect is creating this ticket, and HEAD already contains it in a later state. The staged diff vs HEAD is empty, so this is a redundant commit, not a discarded one (BUG-1109/BUG-1122). The cherry-pick was left in progress for finalize to handle.
