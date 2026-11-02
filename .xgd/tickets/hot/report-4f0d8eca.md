---
uid: report-4f0d8eca
id: REPORT-8243
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:52:34.982102+00:00'
updated_at: '2026-11-02T01:52:34.982102+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-920e1a2c.md` (REQ-196): intent/bookkeeping ticket (2e), UU, outside the sparse cone (conflict existed only in the index). Body identical on base/ours/theirs; only frontmatter differed:
  - HEAD (bce0e203dd, 2026-11-01, "seed_local_overlay_batch"): `status: bundled`, `bundled_in: bundle-5052a63c`, `updated_at: 2026-11-01T23:18:46Z`
  - Incoming (07196398e1, 2026-09-06, "update request request-920e1a2c"): `status: ready_to_reconcile`, `updated_at: 2026-09-06T19:44:21Z`
  - Rule: same field (status/updated_at) changed differently → keep the more recent side per fact (enrichment rule: more recent commit by timestamp). HEAD is two months later and is a lifecycle-later state (ready_to_reconcile → bundled into the very bundle being reconciled); HEAD also carries `bundled_in`, which incoming never touched. Resolved to HEAD's blob (88ef14e7) in the index; skip-worktree bit retained.

## Incoming changes preserved

No code files involved. The incoming commit's only change (status → ready_to_reconcile) is a stale, superseded lifecycle transition: HEAD already advanced the ticket past it to `bundled`. Applying it would regress REQ-196 out of bundle-5052a63c. The resolution nets to no diff vs HEAD (redundant/superseded commit, not a discard of developer code); left for finalize to detect as empty.

Flagged for post-merge review per enrichment rule (intent unknown on one side).
