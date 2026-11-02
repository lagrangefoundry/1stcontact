---
uid: report-8796c3eb
id: REPORT-7980
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:19:49.296726+00:00'
updated_at: '2026-11-02T00:19:49.296726+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51) — intent/bookkeeping ticket (2e). Rule: one side is a strict superset → keep the superset (HEAD).
  - Incoming 8ad9c00bb9 ("update bug bug-61165116") changed base only by adding `fields.chat_comment: comment-cc47f70c`.
  - HEAD already contains that identical line, plus later fields (`severity: high`, `commits`, `version: 0.2.74`, `bundled_in: bundle-39edf66d`), the full title/body, and status `free_and_reconciled`.
  - Conflict markers removed, HEAD content kept; staged with `git add --sparse`.

## Incoming changes preserved

- The incoming commit's only change (`chat_comment: comment-cc47f70c`) is present in the resolved file. Resolution nets to no diff vs HEAD — commit is redundant (already landed), not discarded. Finalize step should detect the empty staged diff.
- No code files involved. No BUG-1301 drops.

Note: unrelated unstaged working-tree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `.xgd/tickets/hot/report-2417957e.md`) were left untouched.
