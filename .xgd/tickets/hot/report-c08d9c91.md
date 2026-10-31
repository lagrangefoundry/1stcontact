---
uid: report-c08d9c91
id: REPORT-7029
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:09:24.869456+00:00'
updated_at: '2026-10-31T22:09:24.869456+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` (REQ-157). Class: intent/bookkeeping ticket (2e: request). The file is outside the sparse cone, so the conflict was index-only. Resolved with `git checkout --ours` then `git add --sparse`.
  - Incoming 6a6049c3f5 (2026-09-02 13:50:28) changes only front matter: `status: draft` to `free_coding`, `last_field_updated: status`, and `updated_at`. It also drops the trailing newline.
  - HEAD carries `status: free_and_reconciled`, `updated_at` 2026-10-30 and `completed_at` 2026-10-30. That is the same fields, changed later.
  - Per-fact rule: the later intent wins, so HEAD's front matter is kept.

## Incoming changes preserved

- No code files were involved.
- The incoming change is a lifecycle step (`free_coding`) that HEAD has already passed through to `free_and_reconciled`. The commit is redundant on this branch, and the staged diff against HEAD is empty, so finalize should skip it (BUG-1109/BUG-1122 shape).
