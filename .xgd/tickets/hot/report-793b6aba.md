---
uid: report-793b6aba
id: REPORT-7363
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:16:28.143058+00:00'
updated_at: '2026-11-01T06:16:28.143058+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-20bd7d63.md` (REQ-166): intent/bookkeeping ticket (2e). The conflict existed only in the index because the path is outside the sparse cone. Resolved with `git checkout --ours` and `git add --sparse`.
  - The incoming commit 907cf7dcea (2026-09-02 16:45:32) changes only the header: `updated_at`, `last_field_updated: status`, and `status: draft -> free_coding`. It also drops the trailing newline at end of file.
  - HEAD already holds a later value for the same facts: `status: free_and_reconciled`, completed and updated 2026-11-01. Following the enrichment rule (more recent timestamp wins), I kept HEAD. Applying the incoming value would move the ticket from completed back to `free_coding`.

## Incoming changes preserved

- Not applied, deliberately. The incoming change is a status step that HEAD has already passed (free_coding happens before free_and_reconciled). This is redundant/stale, not discarded developer content. The only other hunk removes the trailing newline, which is cosmetic.
- The staged result has no diff against HEAD, so the finalize step should detect the empty commit and skip it. Flagged for post-merge review per the enrichment rule (intent unknown on both sides).

Untouched (out of scope): unstaged `.xgd/_changes/log.ndjson` and `.xgd/_changes/meta.json`, and untracked `.xgd/tickets/hot/report-00422d69.md`.
