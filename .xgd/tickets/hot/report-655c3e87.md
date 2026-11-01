---
uid: report-655c3e87
id: REPORT-7677
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:05:55.397435+00:00'
updated_at: '2026-11-01T15:05:55.397435+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179): intent/bookkeeping ticket (2e). Resolved by keeping the superset: HEAD's version.
  - Frontmatter: HEAD has `status: free_and_reconciled`, updated/completed 2026-11-01. Incoming (a56d736cfb, 2026-09-03) has `status: free_coded`, `completed_at: null`. HEAD is later on the same fields, so HEAD was kept.
  - fields: HEAD has the second commit entry (5bace72f…), `version: 0.2.69`, `depends_on: [REQ-178]`, `bundled_in: bundle-94dbe947`. Incoming has `version: 0.2.61` only. HEAD is a strict superset and later, so HEAD was kept.
  - Body: HEAD has the full acceptance bullets plus the "Reopened 2026-09-04" amendment and its implementation delta. Incoming only re-wraps the same two acceptance bullets that HEAD already has. HEAD is a superset, so HEAD was kept.

## Incoming changes preserved

There are no code files. The incoming commit is a stale snapshot of the same ticket, and every fact it carries is already in HEAD in a later form. Its unique values (status free_coded, version 0.2.61, completed_at null) are older states that HEAD's later updates replaced. The resolved file is HEAD's content plus a trailing newline. It's effectively redundant, with no net content change.
