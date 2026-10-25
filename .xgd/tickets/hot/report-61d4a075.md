---
uid: report-61d4a075
id: REPORT-6679
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:39:05.727305+00:00'
updated_at: '2026-10-25T22:39:05.727305+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` (BUG-43): intent/bookkeeping ticket (2e). The enrichment says intent is unknown on one or both sides, so the rule is to take the more recent commit by timestamp. Took HEAD (`git checkout --ours`, then `git add --sparse`).
  - HEAD: e8f9e7c85b, committed 2026-09-19T08:15:28-07:00. status `free_and_reconciled`, completed_at 2026-09-14, updated_at 2026-09-19, `bundled_in: bundle-8e1807f6`.
  - Incoming: eb9960199f, committed 2026-09-01T15:36:07-07:00. status `free_coded`, completed_at null, updated_at 2026-09-01, no `bundled_in`.
  - The incoming side is an older snapshot of the same ticket. HEAD is a strict superset that advances the same lifecycle, so taking incoming would move the ticket backwards. Flagged for post-merge review as the enrichment rule requires.

## Incoming changes preserved

No code files were involved. The incoming commit is a stale ticket-state snapshot that later commits on HEAD already supersede, so it is redundant rather than discarded. The staged result has no diff against HEAD; finalize should detect this and skip the commit.
