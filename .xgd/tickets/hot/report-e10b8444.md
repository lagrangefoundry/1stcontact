---
uid: report-e10b8444
id: REPORT-7641
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:40:24.607721+00:00'
updated_at: '2026-11-01T14:40:24.607721+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-8c5c0bb6.md` (REQ-168): intent/bookkeeping ticket (class 2e). Superset rule: kept HEAD (ours). Staged with `git add --sparse` because the file is outside the sparse cone.

## Incoming changes preserved

The incoming commit 458a278c5d (2026-09-03, status `draft`) adds a "Revision: the decisions this ticket had left open" section. HEAD (2026-11-01, status `free_and_reconciled`) is a strict superset in substance. Every incoming subsection is already part of HEAD's body under its own heading:
- read table corrected → "The six reads"
- path prefix → "The target travels as a path prefix"
- no-target fallback → "The no-target fallback is the first admissible business"
- unconfigured local dev → "The dev-open branch"
- per-business chat host → "The chat host is per isolate"
- deactivated business → "The resolver checks `tenants.status`"
- account/business/tenant → "Vocabulary"
- Acceptance → "Acceptance" (expanded)

HEAD also adds "What the implementation added, and why". Taking theirs would have rolled the ticket back to a superseded draft and reset its status and completed_at. The commit is redundant here, not discarded: the staged diff against HEAD is empty, so finalize should skip it. Flagged for post-merge review per the enrichment rule.
