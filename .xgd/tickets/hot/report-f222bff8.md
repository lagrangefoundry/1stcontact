---
uid: report-f222bff8
id: REPORT-7503
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:43:57.164592+00:00'
updated_at: '2026-11-01T07:43:57.164592+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184): intent/bookkeeping ticket (2e), UU, outside the sparse cone. Rule: strict superset — kept HEAD (ours, blob 77cbbf8955) via `git checkout --ours` + `git add --sparse`.
  - Incoming b9d13f5550 (2026-09-04 17:13 -0700) changed: updated_at → 2026-09-05T00:13:17, status free_coding → `free_coded`, added `commits` (working_sha 65c38cd5…) and `version: 0.2.66`, trailing-newline change.
  - HEAD already carries the identical `commits` and `version` fields, plus later state: status `bundled`, `bundled_in: bundle-94dbe947`, updated_at 2026-11-01T05:18:05, and the REQ-185 ordering sentence.
  - Only incoming values not kept: its older `updated_at` and `status: free_coded`, superseded by HEAD's later `bundled` status (lifecycle progression free_coded → bundled). Matches enrichment rule "take the more recent commit by timestamp".

## Incoming changes preserved

No code files in conflict. The incoming commit's substantive additions (`commits` entry, `version: 0.2.66`) are present verbatim in HEAD; the commit is redundant (BUG-1109/BUG-1122 shape) and stages to no diff vs HEAD. Flagged for post-merge review per enrichment rule (intent unknown on both sides); no content lost.
