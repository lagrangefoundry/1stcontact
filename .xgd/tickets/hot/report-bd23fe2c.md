---
uid: report-bd23fe2c
id: REPORT-7051
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:23:55.374883+00:00'
updated_at: '2026-10-31T22:23:55.374883+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` — intent/bookkeeping ticket (2e; request ticket, sparse/index-only conflict). Rule: superset wins / later state per fact. Resolved to OURS (HEAD blob 67b4a65402), staged at stage 0 with skip-worktree bit restored.

## Incoming changes preserved

Incoming commit 073b9b37bc (2026-09-02T21:51) changed only: status free_coding -> free_coded, last_field_updated -> status, updated_at, added fields.commits (both reconcile_sha null) and fields.version 0.2.44, and stripped the trailing newline.
HEAD (updated 2026-10-30) is a strict superset/later state of every one of those facts: status advanced further to free_and_reconciled with completed_at set, the same commits list with reconcile_sha e2676a77 populated, version 0.2.44, plus bundled_in bundle-5607a08d and later body edits (consultant rename, field-evidence section, "Behaviour the build settled"). Taking incoming for any field would regress status/reconcile state. The incoming commit's effect is already present in HEAD (redundant, not discarded); the staged diff vs HEAD is empty — finalize step should detect and skip. Only the trailing-newline removal is not carried over (cosmetic).

The file is flagged for post-merge review per the enrichment rule (intent unknown on both sides), though the resolution is unambiguous.
