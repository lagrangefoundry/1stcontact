---
uid: report-3c1d2069
id: REPORT-7167
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:44:38.771028+00:00'
updated_at: '2026-10-31T23:44:38.771028+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-e53d068f.md` — UU, intent/bookkeeping ticket (2e). Rule: one side is a strict superset → keep the superset (HEAD/ours, stage 2 blob 7477e6299e). Ours is also the more recent side by timestamp (updated_at 2026-10-31T20:54:35 vs incoming 2026-09-03T01:34:28), which agrees with the enrichment rule.
  - Ours vs base: status free_coding→bundled, fields.commits / version 0.2.56 / bundled_in bundle-fd009b93 added, and the two appended body sections ("What the implementation settled that the plan did not", "Where the relocated claims went").
  - Theirs vs base: the SAME two body sections, word for word, plus updated_at / last_field_updated: body. Those two metadata scalars are superseded by ours' later update.
  - The file sits outside the sparse cone (index-only conflict), so stage 0 was set to the ours blob with `git update-index --index-info`, and the working-tree copy was restored from the index.

## Incoming changes preserved

The incoming commit's only content change, the two appended body sections, is already in HEAD verbatim. The resolution nets to no diff vs HEAD because the commit is redundant, not because anything was discarded (BUG-1109/BUG-1122 shape). No code files were involved, and no hunks were dropped under BUG-1301.

Unrelated pre-existing worktree state was left untouched: unstaged edits to .xgd/_changes/log.ndjson and .xgd/_changes/meta.json, and the untracked .xgd/tickets/hot/report-9f403ca6.md.
