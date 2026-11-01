---
uid: report-e68602fe
id: REPORT-7769
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:03:37.519935+00:00'
updated_at: '2026-11-01T16:03:37.519935+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51) — AA (both added), intent/bookkeeping ticket (2b/2e). Kept OURS (HEAD) via `git add --sparse` (outside sparse cone, index-only conflict). Rule: strict superset.
  - Incoming (3cde6368a5, "xgd(ticket): create bug bug-61165116", 2026-09-05) is the original creation stub: `title: Untitled`, `status: draft`, body `(new ticket)`, fields auto_merge_back/needs_review/priority only.
  - HEAD carries the same uid/id/created_at with every incoming field present plus the later evolution: real title, severity high, chat_comment, commits, version 0.2.74, `status: bundled`, `bundled_in: bundle-39edf66d`, full spec body (Symptom, Mechanism, B1–B3, test plan). Only `title`, `status`, `updated_at`, `last_field_updated` and body differ, and HEAD's values are strictly later (updated_at 2026-11-01 vs 2026-09-05). HEAD is a strict superset in every other respect.

## Incoming changes preserved

No code files in conflict. The incoming commit only creates this ticket stub; its creation (uid, id, created_at, created_by, base fields) is already in HEAD. Its placeholder title, draft status and `(new ticket)` body have been replaced by later edits to the same ticket, so the commit is redundant. The staged result has no diff vs HEAD, so finalize should skip the commit as empty.
