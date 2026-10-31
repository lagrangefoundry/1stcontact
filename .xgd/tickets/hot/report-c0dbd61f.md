---
uid: report-c0dbd61f
id: REPORT-7111
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:03:33.700184+00:00'
updated_at: '2026-10-31T23:03:33.700184+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md`: bug ticket, intent/bookkeeping class (2e). The conflict existed only in the index (sparse checkout). Resolved by taking HEAD (`git checkout --ours`, then `git add --sparse`). Per-fact analysis:
  - `status` / `updated_at` / `completed_at` / `last_field_updated`: both sides changed these differently. Both sides belong to the same intent (bug-46140599), so the timestamp rule from the enrichment applies. HEAD (2026-10-30, `free_and_reconciled`, completed) is later than incoming (2026-09-02, `free_coded`, `completed_at: null`). Kept HEAD.
  - `fields.commits` (working_sha b8e0b7f8af65…) and `fields.version: 0.2.47`: added by the incoming commit and already present verbatim on HEAD. Redundant.
  - `fields.bundled_in: bundle-5607a08d`: present only on HEAD; the incoming commit never touched it. Kept.
  - Trailing newline at EOF: cosmetic. Kept HEAD.

## Incoming changes preserved

There are no code files. The incoming commit 1b32dc673e is a stale ticket update from 2026-09-02. Every substantive fact it adds (commits entry, version) is already on HEAD, and HEAD has later values for its status fields. The staged resolution has no diff against HEAD. This is a redundant commit (BUG-1109/BUG-1122 shape), not a discard, so the finalize step should skip it.
