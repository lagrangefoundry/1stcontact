---
uid: report-d700eb13
id: REPORT-7339
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:03:08.489275+00:00'
updated_at: '2026-11-01T06:03:08.489275+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` — intent/bookkeeping ticket (2e; outside sparse cone, resolved in index). Rule: superset — kept HEAD (`git checkout --ours` + `git add --sparse`).
  - Only conflicting hunk was frontmatter lifecycle fields. HEAD: `status: free_and_reconciled`, `completed_at: 2026-10-30T21:51:40`, `updated_at: 2026-10-30T21:51:52`, `last_field_updated: status`. Incoming (46d977cc55): `status: draft`, `completed_at: null`, `updated_at: 2026-09-02T23:29:53`, `last_field_updated: body`. HEAD is ~2 months later and represents the completed/reconciled ticket; taking incoming would reopen a finished bug. Matches the enrichment rule (more recent by timestamp).

## Incoming changes preserved

- The incoming commit's only substantive change — BUG-49 widening of acceptance criterion 5 ("Either refusal — and equally a discovery request that cannot complete at all… the `success: false`-under-200 shape must not be read as a successful empty list…") — is already present verbatim in HEAD's version of the file. The commit is therefore redundant on this branch (BUG-1109/BUG-1122 shape): staged diff vs HEAD is empty, left for cherry_pick_finalize_resolution to skip. No developer content discarded.

## Post-merge review flag

- `.xgd/tickets/hot/bug-46140599.md` flagged per enrichment rule (intent unknown on both sides); resolution is low-risk since HEAD ⊇ incoming body.
