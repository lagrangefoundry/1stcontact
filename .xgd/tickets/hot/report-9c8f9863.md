---
uid: report-9c8f9863
id: REPORT-7043
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:18:08.753455+00:00'
updated_at: '2026-10-31T22:18:08.753455+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md` (BUG-47) — intent/bookkeeping ticket (2e). Conflict was header-only (status/updated_at/completed_at and `bundled_in`); body auto-merged. Resolution: kept HEAD (ours) for both hunks.
  - HEAD: updated_at 2026-10-30T21:51:53, completed_at 2026-10-30T21:51:47, status `free_and_reconciled`, `bundled_in: bundle-5607a08d`.
  - Incoming (fe7fa02c60): updated_at 2026-09-02T21:13:00, completed_at null, status `free_coded`, no bundled_in.
  - HEAD is a strict superset/later state: it advances the same ticket past the incoming status and adds `bundled_in`. Per 2e (superset) and the enrichment rule (take the more recent side by timestamp), HEAD wins. Applying incoming would move the ticket back to an earlier status and drop its bundle link.

## Incoming changes preserved

No code files were in conflict. The incoming commit is a stale status update (free_coded) that HEAD already moved past (free_and_reconciled), so it is redundant: its effect is already in HEAD's history, not thrown away. The staged diff against HEAD is empty, so finalize should treat this as a no-op commit.

## Flag for post-merge review

The enrichment rule asked for this file to be flagged: bug-364445f8.md was resolved by timestamp with intent unknown on both sides.
