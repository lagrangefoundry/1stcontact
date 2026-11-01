---
uid: report-c80b6003
id: REPORT-7343
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:05:06.908574+00:00'
updated_at: '2026-11-01T06:05:06.908574+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` (BUG-49) — intent/bookkeeping ticket (2e), UU, outside sparse cone. Resolved to HEAD (`git checkout --ours` + `git add --sparse`). Per-fact:
  - `updated_at` / `completed_at` / `status`: same facts changed differently. Incoming (1b32dc673e, 2026-09-02) sets `status: free_coded`, `completed_at: null`; HEAD (2026-10-30) sets `status: free_and_reconciled` with `completed_at`. HEAD is the later lifecycle state (matches the enrichment rule: take the more recent commit by timestamp) → HEAD kept.
  - `fields.bundled_in: bundle-5607a08d`: present only on HEAD (added after the incoming commit) → kept (superset).
  - `fields.commits` (working_sha b8e0b7f8af…) and `fields.version: 0.2.47`, added by the incoming commit: already present identically in HEAD.
  - Body: no conflicting change (incoming only changed the trailing newline).

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's additions (`commits`, `version`) appear in the resolved file. Its status advance (draft → free_coded) has been superseded by HEAD's later `free_and_reconciled`. The commit is therefore redundant against HEAD, not discarded; the staged diff vs HEAD is expected to be empty (BUG-1109/BUG-1122), and finalize should skip it.
