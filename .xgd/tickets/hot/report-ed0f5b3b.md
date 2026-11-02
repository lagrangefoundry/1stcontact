---
uid: report-ed0f5b3b
id: REPORT-8071
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:53:59.414174+00:00'
updated_at: '2026-11-02T00:53:59.414174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-920e1a2c.md` — intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: one side a strict superset → keep the superset (ours, blob 88ef14e7). Resolved by replacing stages 1-3 with ours at stage 0 via `git update-index --index-info`; skip-worktree flag restored.

## Incoming changes preserved

Incoming commit 12ae6f2eed made two kinds of change:
- Body: REQ-136 → REQ-198 (3 refs) and REQ-135 → REQ-197 (1 ref). All four are already present verbatim in HEAD's version (verified via `git diff <base> <ours>`).
- Frontmatter: `updated_at: 2026-09-05T23:44:53` and `last_field_updated: body`. HEAD's version has the later `updated_at: 2026-11-01T23:18:46` / `last_field_updated: status` (status advanced draft → bundled, commits, version, bundled_in, story_points, chat_comment, "What landed" section added), which supersedes these timestamp fields.

Net staged diff vs HEAD is empty: the commit is genuinely redundant (its effect already landed in HEAD), not discarded. Finalize step should detect the clean diff and skip.
