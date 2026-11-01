---
uid: report-c4c0782a
id: REPORT-7775
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:07:41.467914+00:00'
updated_at: '2026-11-01T16:07:41.467914+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-7af3f4e4.md` — intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: one side is a strict superset → keep the superset. Resolved to HEAD's (stage 2) blob 2e21cdb089 at stage 0, skip-worktree bit restored.

## Incoming changes preserved

Incoming commit 658f481c7b ("xgd(ticket): update request request-7af3f4e4") changes exactly two things vs base b2c4295336:
1. adds `fields.chat_comment: comment-a289690d`
2. removes the trailing newline at end of file

Both are already present in HEAD's version. HEAD additionally carries later state the incoming side lacks (status draft→bundled, story_points 2→3, `commits`, `version: 0.2.73`, `bundled_in: bundle-39edf66d`, expanded body/acceptance). Taking theirs would have regressed all of that to the 2026-09-05 draft. The commit is redundant (no net diff vs HEAD), not discarded; the finalize step should detect the empty staged diff and skip it.

No hunks dropped under BUG-1301. STEP 3h not invoked.

Note: the "more recent timestamp" enrichment rule agrees — HEAD's ticket updated_at is 2026-11-01, incoming's is 2026-09-05.

Pre-existing unstaged `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json` and untracked `.xgd/tickets/hot/report-19c4f40b.md` left untouched.
