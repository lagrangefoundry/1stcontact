---
uid: report-27a2ed4d
id: REPORT-6999
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:52:00.121667+00:00'
updated_at: '2026-10-31T21:52:00.121667+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — intent/bookkeeping ticket (2e). Two frontmatter facts conflicted; resolved per fact, HEAD side kept for both:
  - `fields.bundled_in`: HEAD `bundle-87be4669` (BUNDLE-26, created 2026-09-09T21:32:49, status `free_and_reconciled`) vs incoming `bundle-203b1dc2` (BUNDLE-23, created 2026-09-02T17:48:26, stuck at `reconciling`). Both bundles carry the same ticket set (REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more); BUNDLE-26 is the later re-bundling that supersedes BUNDLE-23. Kept HEAD.
  - `updated_at`: HEAD `2026-09-09T21:32:49.608058` (matches BUNDLE-26 creation) vs incoming `2026-09-02T17:48:26.845864` (matches BUNDLE-23 creation). Kept the later HEAD timestamp.
  - All other content was identical on both sides.

Staged with `git add --sparse` (path outside sparse cone). Resolution nets to no diff vs HEAD; left for cherry_pick_finalize_resolution to skip.

## Incoming changes preserved

No code files involved. The incoming commit (7123292250, "update request request-909e42f8") only re-pointed REQ-164 at the older BUNDLE-23 and stamped its 09-02 timestamp; both facts are stale on this branch, where HEAD already records the later BUNDLE-26 association.

## Arbitration of last resort (BUG-1460)

- `.xgd/tickets/hot/request-909e42f8.md`: incoming hunk dropped as stale. Evidence (tier 1, most recent intent): the bundle ticket on HEAD's side (BUNDLE-26) postdates and supersedes the incoming side's BUNDLE-23 for the same ticket set, and the enrichment rule ("take the more recent commit by timestamp") points the same way. Incoming side dropped. Flagged for post-merge review per enrichment rule.
