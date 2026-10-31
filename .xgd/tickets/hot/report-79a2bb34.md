---
uid: report-79a2bb34
id: REPORT-6959
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:24:48.738354+00:00'
updated_at: '2026-10-31T21:24:48.738354+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — UU, intent/bookkeeping ticket (class 2e; bug-* ticket). Rule applied: "one side is a strict superset — keep the superset", consistent with the enrichment rule "take the more recent commit by timestamp". Resolved with `git checkout --ours` + `git add --sparse` (path is outside the sparse cone).

  Field comparison (HEAD kept / incoming 3cebec8702 dropped):
  - status: free_and_reconciled / ready_to_reconcile
  - updated_at: 2026-09-19T15:15:30Z / 2026-09-01T23:10:29Z
  - completed_at: 2026-09-14T10:29:09Z / null
  - commits[0].reconcile_sha: 332f63424d7b... / null
  - commits[0].working_sha_history: [] / (absent)
  - bundled_in: bundle-8e1807f6 / (absent)
  - working_sha d019bab7..., body, and all other fields: identical on both sides

## Incoming changes preserved

No code files were in conflict. The incoming commit (3cebec8702, "xgd(ticket): update bug bug-93851fea") is an older snapshot of the ticket: it is the ready_to_reconcile state from 2026-09-01. HEAD already has the later lifecycle progression for that ticket: reconciled, bundled into bundle-8e1807f6, and completed 2026-09-14. Every field where incoming differs is one HEAD has since advanced. Applying incoming would regress the ticket's status and wipe its reconcile_sha and bundled_in, and it adds nothing absent from HEAD. The resolution nets to no staged diff vs HEAD (a redundant/stale commit, not a discard); the finalize step should detect the empty diff and skip the commit.

Flagged for post-merge review per the enrichment rule (intent unknown on both sides).
