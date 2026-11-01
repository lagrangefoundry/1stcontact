---
uid: report-12a2adb4
id: REPORT-7687
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:11:25.399505+00:00'
updated_at: '2026-11-01T15:11:25.399505+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-da60b61b.md` — intent/bookkeeping ticket (class 2e; enrichment rule: take more recent commit by timestamp). Resolved to HEAD (ours, blob 10fafc65bb) via `git add --sparse` (path outside sparse cone).
  - Incoming a11b488e0a (2026-09-03T21:59) advanced status free_coding -> free_coded and added `commits` (f205968b…, fe95f12f…) and `version: 0.2.62`.
  - HEAD (2026-11-01T13:58) already contains the identical `commits` list and `version`, plus later facts: status `free_and_reconciled`, `completed_at`, `story_points: 2`, `bundled_in: bundle-94dbe947`.
  - HEAD is a strict superset except for the `status`/`updated_at`/trailing-newline facts, where HEAD is the later write (timestamp rule) — applying incoming would regress status.

## Incoming changes preserved

No code files involved. Incoming's substantive additions (`commits`, `version`) are present in HEAD verbatim; its status value is superseded by HEAD's later status. Resolution nets to no diff vs HEAD — commit is redundant (effect already landed), not discarded. Flag for post-merge review per enrichment rule: low priority, ticket state is consistent.

Note: HEAD body ends with a stray "\n-" line (pre-existing, not introduced here).
