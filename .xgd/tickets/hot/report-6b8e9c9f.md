---
uid: report-6b8e9c9f
id: REPORT-7627
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:31:01.097412+00:00'
updated_at: '2026-11-01T14:31:01.097412+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-597b41d2.md` (BUG-46): intent/bookkeeping ticket (rule 2e). Both conflict hunks were in the frontmatter only (status/timestamps block and `fields.commits` block). Rule: one side is a strict superset, so keep the superset (HEAD). Resolved by hand to keep git's automatic merge of the rest of the file, then staged with `git add --sparse`.

## Incoming changes preserved

Incoming commit 321ff611e5 (2026-09-02, "xgd(ticket): update bug bug-597b41d2") changed:
- `status: draft -> free_coded`, `last_field_updated: status`, `updated_at` 2026-09-03: HEAD has a later lifecycle state for the same facts (`status: free_and_reconciled`, `updated_at`/`completed_at` 2026-11-01). It is also the more recent commit by timestamp, so HEAD's values are kept.
- Added `fields.commits` (working SHAs 6be7ac96, 0fadd0f7, 32db3756) and `version: 0.2.57`: all present in HEAD, which additionally carries `working_sha_history`, `reconcile_sha 2d59060f` on 32db3756, and `bundled_in: bundle-fd009b93`.
- Removed the trailing newline at end of file: preserved (this is the only net staged diff vs HEAD).

No incoming content was lost. Where the two sides gave different values for the same fact, HEAD's are the later values in the same lifecycle. The commit is almost redundant: its staged diff vs HEAD is just the end-of-file newline.

## Note

`completed_at` is non-null on HEAD and null on incoming. Kept HEAD's value as part of the later reconciled state. Flagged for post-merge review per the enrichment rule ("intent unknown on one or both sides").
