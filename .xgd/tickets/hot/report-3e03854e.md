---
uid: report-3e03854e
id: REPORT-8252
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:55:46.020382+00:00'
updated_at: '2026-11-02T01:55:46.020382+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-bce2b6f9.md` (REQ-193): intent/bookkeeping ticket (2e), UU, outside the sparse cone. Resolved to **ours** (HEAD) with `git checkout --ours` + `git add --sparse`.
  - The incoming commit 3ceec56018 ("update request request-bce2b6f9", 2026-09-06) changes only frontmatter: `status: free_coded -> ready_to_reconcile`, `last_field_updated: story_points -> status`, `updated_at -> 2026-09-06T19:44:53`.
  - HEAD has a strictly later state for the same facts: `status: bundled`, `last_field_updated: status`, `updated_at: 2026-11-01T23:18:45`, plus `bundled_in: bundle-5052a63c`. Body text is byte-identical on both sides.
  - Rule applied: 2e superset/later-state, plus the enrichment rule "take the more recent commit by timestamp". Taking theirs would move the ticket backwards from bundled to ready_to_reconcile and drop `bundled_in`.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only effect (advancing REQ-193 to `ready_to_reconcile`) has already been overtaken in HEAD by the later `bundled` transition. This is a redundant commit, not a discarded one, and the resolution stages to no diff against HEAD. Finalize should skip the empty commit.

Flagged for post-merge review per the enrichment rule ("intent unknown on one or both sides").

Unrelated working-tree changes were left untouched and not staged: `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json` (both modified), and the untracked `.xgd/tickets/hot/report-c8d6a55a.md`.
