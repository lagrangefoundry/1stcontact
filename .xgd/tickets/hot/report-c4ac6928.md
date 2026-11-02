---
uid: report-c4ac6928
id: REPORT-8156
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:24:09.002901+00:00'
updated_at: '2026-11-02T01:24:09.002901+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-2e50962c.md` — intent/bookkeeping ticket (2e), index-only (outside sparse cone). Resolved to OURS (stage 2, blob 0f63e73a0d), identical to HEAD; skip-worktree bit restored.
  - Incoming 76cbe59bfb (2026-09-06) changed only `updated_at`, `last_field_updated: body→status`, `status: draft→free_coding`.
  - HEAD changed the same three fields later (2026-11-01: `status: bundled`, `last_field_updated: status`) and also added story_points 5, commits, version 0.2.86, bundled_in bundle-5052a63c, and the "What landed" body section.
  - Same-fact conflict → later intent wins per fact (HEAD, Nov 1 > incoming, Sep 6). For the incoming fields, HEAD is a strict superset of the lifecycle: the request already went through free_coding and on to bundled. The incoming commit touches no other fields.

## Incoming changes preserved

No code files involved. The incoming commit's only effect (status advance to free_coding) has already been overtaken in HEAD (status is now bundled), so the commit is redundant (BUG-1109/BUG-1122 shape) and not discarded. The staged diff vs HEAD is empty, so finalize should skip the commit.
