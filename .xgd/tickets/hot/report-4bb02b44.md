---
uid: report-4bb02b44
id: REPORT-7927
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:02:46.887717+00:00'
updated_at: '2026-11-02T00:02:46.887717+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179). File class: 2e (intent/bookkeeping ticket). Conflict confined to frontmatter `updated_at` / `completed_at` / `status` — same facts changed differently on each side. Rule: later-positioned side wins per fact (enrichment rule: more recent by timestamp). Kept HEAD: `status: free_and_reconciled`, `updated_at: 2026-11-01T13:58:45Z`, `completed_at: 2026-11-01T13:58:40Z`. Dropped incoming (f3986e0edc, 2026-09-05): `status: ready_to_reconcile`, `completed_at: null`. Body had no conflict and is unchanged. Staged with `git add --sparse`.

## Incoming changes preserved

No code files in conflict. The incoming commit f3986e0edc touched only the three frontmatter lines above (3+/3-); it is a stale status transition from 2026-09-05 that HEAD has since advanced past (the ticket was reopened, re-coded, and reconciled to free_and_reconciled on 2026-11-01). Applying it would regress a completed ticket. Resolution nets to no diff vs HEAD — redundant/superseded commit, left for finalize to skip.

## Arbitration of last resort (BUG-1460)

Not invoked; resolved directly by rule 2e (per-fact later timeline).
