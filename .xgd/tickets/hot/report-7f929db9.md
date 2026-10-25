---
uid: report-7f929db9
id: REPORT-6721
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:31:14.454384+00:00'
updated_at: '2026-10-25T23:31:14.454384+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md`: intent/bookkeeping ticket (2e). Applied the strict-superset rule plus the per-fact later-intent rule, and kept OURS (stage 2, blob b0ba8eb8).
  - Incoming 33f97305 ("update bug bug-364445f8") appends the "What was implemented" and "Test plan" body sections, sets `last_field_updated: body`, and has `updated_at` 2026-09-02T21:12:06.
  - OURS already contains that body text verbatim. The only body difference is that OURS has no final trailing newline (xgd's later serialisation).
  - OURS also has the later lifecycle state: `status: bundled`, `updated_at` 2026-10-25T22:19:54, `last_field_updated: status`, plus `commits`/`version`/`bundled_in`. For these metadata facts, the later-positioned side wins.
  - The path is outside the sparse cone, so the OURS blob was staged into the index via `git update-index --cacheinfo` and skip-worktree was set.

## Incoming changes preserved

- The incoming body addition is present verbatim in the resolved file.
- The incoming `status: free_coding` and `updated_at`/`last_field_updated` values are superseded by HEAD's later lifecycle state.
- The net staged diff against HEAD is empty: a redundant commit, left for finalize to skip. No `--skip` was run here.
- No code files were involved.

## Flag for post-merge review

The enrichment asked for this file to be flagged because the intent is unknown on one side. Risk is low, since the resolved content equals HEAD.
