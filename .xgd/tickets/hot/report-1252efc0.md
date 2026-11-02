---
uid: report-1252efc0
id: REPORT-8012
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:30:23.773820+00:00'
updated_at: '2026-11-02T00:30:23.773820+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-7af3f4e4.md` (REQ-186): intent/bookkeeping ticket (2e). The only conflict was in frontmatter lifecycle fields (`updated_at`, `completed_at`, `status`). Both sides changed the same facts differently. HEAD (updated 2026-11-01T22:57:24Z) has `status: free_and_reconciled` with `completed_at` set. Incoming a1c9811e08 (2026-09-05T18:58:31Z) sets `status: ready_to_reconcile`, `completed_at: null`. I kept HEAD for these facts: it is the later state, and its status is past the incoming one in the lifecycle (incoming is a stale earlier snapshot). Per the enrichment rule, the more recent timestamp wins. Body and other fields had no conflict. Flagged for post-merge review as the enrichment asks (intent unknown on both sides).

## Incoming changes preserved

No code files were involved. The incoming commit touches only this ticket's three lifecycle fields. HEAD already carries a later version of the same facts, so the incoming change is redundant (superseded). After resolution the staged diff against HEAD is empty, so finalize should detect a clean staged diff and skip the commit.
