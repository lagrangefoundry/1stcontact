---
uid: report-f91d4f26
id: REPORT-6997
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:50:15.021781+00:00'
updated_at: '2026-10-31T21:50:15.021781+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` — intent/bookkeeping ticket (2e); out of sparse cone, resolved with `git checkout --ours` + `git add --sparse`. Rule: same fields changed differently on each side → take the more recent side per fact (enrichment rule: "take the more recent commit by timestamp").
  - Front matter: HEAD (updated_at 2026-10-30T21:51:54, status `free_and_reconciled`, completed_at set) is more recent than incoming 1ed9348799 (updated_at 2026-09-02T02:07:46, status `ready_to_reconcile`, completed_at null). HEAD kept; taking incoming would regress the ticket's status.
  - Body ("Not in scope" / "Superseded in part by BUG-44"): both sides carry identical content; incoming differs only in hard-wrapping at ~80 cols. HEAD's text kept — no substantive content lost.

## Incoming changes preserved

No code files in conflict. The incoming commit's substantive content (BUG-44 supersession section, not-in-scope items) is already present in HEAD; the only differences dropped are an older status/timestamp (superseded by HEAD's later reconcile completion) and line wrapping. Staged diff vs HEAD is empty — this commit is redundant (BUG-1109/BUG-1122 shape), not discarded. Left for finalize to detect the clean staged diff.

Flag for post-merge review per enrichment rule (intent unknown on one or both sides).
