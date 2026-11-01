---
uid: report-51ef6eb8
id: REPORT-7767
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:01:56.233561+00:00'
updated_at: '2026-11-01T16:01:56.233561+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-420e1a6e.md` (REQ-170) — intent/bookkeeping ticket (2e). Index-only conflict (outside sparse cone). Rule: one side is a strict lifecycle superset → keep the superset (ours). Resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming cc143a39d2 ("update request request-420e1a6e") changes only frontmatter vs base: status free_coded → ready_to_reconcile, updated_at 2026-09-05T17:30.
  - Ours (HEAD): status `bundled`, `fields.bundled_in: bundle-39edf66d`, updated_at 2026-11-01. `bundled` is the lifecycle step after `ready_to_reconcile`; the bundle being reconciled here is the one that state refers to.
  - Body identical on both sides. Taking theirs would regress status and drop bundled_in. Ours is also more recent by timestamp, matching the enrichment rule.

## Incoming changes preserved

No code files in conflict. The incoming commit's only fact (advance to ready_to_reconcile) is already subsumed by HEAD's later `bundled` state, so the commit is redundant on this branch; staged diff vs HEAD is empty and finalize is expected to skip it. Same pattern as the preceding attempt (c8b231d124, REPORT-7765).

Unrelated pre-existing worktree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `.xgd/tickets/hot/report-e0e3f3ee.md`) left untouched.
