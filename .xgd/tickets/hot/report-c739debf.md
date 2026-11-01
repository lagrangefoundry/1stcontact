---
uid: report-c739debf
id: REPORT-7317
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:51:07.842086+00:00'
updated_at: '2026-11-01T05:51:07.842086+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-43ce519b.md` (REQ-174): intent/bookkeeping ticket (2e). Conflict confined to front-matter fields updated_at, completed_at, last_field_updated, status. Same facts changed differently on each side; kept the later side (HEAD/ours) per fact. Staged with `git checkout --ours` + `git add --sparse` (path is outside the sparse cone).

## Incoming changes preserved

Incoming commit 4d5b5c3248 (authored 2026-09-02 16:00 -0700, "xgd(ticket): update request request-43ce519b") is a stale ticket snapshot: updated_at 2026-09-02T23:00, status free_coded, completed_at null, last_field_updated story_points. HEAD already holds the later state of the same ticket: updated_at 2026-10-30T21:51, status free_and_reconciled, completed_at 2026-10-30T21:51, bundled_in bundle-5607a08d. Its only other payload is story_points (5), which is already 5 in HEAD. So the incoming change's effect is already present or superseded by the later state. The result is no net diff vs HEAD (redundant commit, not discarded developer code). The resolution adds nothing that is not on one side.

## Arbitration of last resort (BUG-1460)

Not used. Resolved directly under rule 2e: the later timestamp wins per fact, and HEAD is about 2 months newer on every conflicting field.
