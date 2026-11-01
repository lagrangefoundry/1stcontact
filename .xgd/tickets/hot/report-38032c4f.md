---
uid: report-38032c4f
id: REPORT-7645
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:42:39.411990+00:00'
updated_at: '2026-11-01T14:42:39.411990+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48) — intent/bookkeeping ticket (rule 2e; enrichment rule "take the more recent commit by timestamp"). Resolved to OURS (HEAD blob 841bca5e16), staged at index stage 0 with skip-worktree preserved (path is outside the sparse cone).
  - Same facts conflicted: `status`, `updated_at`, `last_field_updated`.
  - Incoming 37d6abdc51 (2026-09-03T02:44Z): `draft -> free_coding`.
  - HEAD (2026-11-01T13:58Z): `free_and_reconciled`, `completed_at` set, plus `fields.commits` (3 working/reconcile SHA records) that incoming never touched.
  - HEAD is the later-positioned fact on every conflicting field and a strict superset otherwise, so HEAD kept.

## Incoming changes preserved

No code files involved. The incoming commit's only effect (advancing status to `free_coding`) is already superseded on HEAD: the ticket has since gone through free_coding to `free_and_reconciled`. Re-applying it would regress the ticket's lifecycle. So the staged result nets to no diff vs HEAD, which is a redundant commit (BUG-1109/BUG-1122 shape), not discarded developer code.

## Post-merge review flag

Flagged per enrichment rule. Also note: the branch history shows a repeating "update bundle bundle-39edf66d" / "recover uncommitted .xgd/ state (BUG-603)" cycle. Stale status-only ticket commits like 37d6abdc51 may keep recurring until they're added to the bundle's skipped_commits.
