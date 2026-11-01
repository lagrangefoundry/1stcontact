---
uid: report-638cbc1c
id: REPORT-7303
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:43:35.788245+00:00'
updated_at: '2026-11-01T05:43:35.788245+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` — intent/bookkeeping ticket (2e), outside the sparse cone. The only conflict was the status header (updated_at/completed_at/status). Incoming commit 5947c9b511 (2026-09-02) moved status free_coded -> ready_to_reconcile. HEAD has the later status free_and_reconciled (updated 2026-10-30, completed_at set). Same fact changed on both sides, so I kept the more recent one, HEAD (per the enrichment rule "take the more recent commit by timestamp"). Resolved with `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

There are no code files. The incoming commit only advanced a status, and HEAD has since moved that status further (ready_to_reconcile -> free_and_reconciled). Its effect is already superseded in HEAD, so this resolution has no diff vs HEAD (redundant, not discarded). Finalize should detect the empty staged diff and skip it.

Flagged for post-merge review per the enrichment rule (intent unknown on both sides).
