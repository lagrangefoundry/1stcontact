---
uid: report-153d3e2b
id: REPORT-7165
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:41:25.631202+00:00'
updated_at: '2026-10-31T23:41:25.631202+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-597b41d2.md` (BUG-46): UU, intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so I kept the superset (ours/HEAD, blob 0bbd70d5). This also agrees with the enrichment rule ("take the more recent"): HEAD's updated_at is 2026-10-31T20:54:35 and incoming's is 2026-09-03T00:30:42.
  - `git diff theirs ours` shows only three lines unique to incoming, all stale frontmatter: `status: draft`, `last_field_updated: body` and an older `updated_at`. Every body section incoming added ("The deferred panel wiring now has a ticket", REQ-114 and the non-streaming fallback) is already in HEAD. HEAD also carries the later sections ("The panel wiring landed after all — REQ-114 shipped", "An environment note"), plus the `commits`, `version: 0.2.57` and `bundled_in: bundle-fd009b93` fields and `status: bundled`.
  - The file is outside the sparse cone, so I resolved it in the index with `git update-index --cacheinfo` (HEAD blob) and set `--skip-worktree`. No unmerged entries remain.

## Incoming changes preserved

No code files were involved. All of the incoming commit (b91092cd9b, "update bug bug-597b41d2") body content is already in HEAD, so the staged diff against HEAD is empty. The commit is redundant: its effect landed earlier through a later ticket update (BUG-1109/BUG-1122 shape), so nothing was discarded. The cherry-pick is still paused; finalize should detect the clean staged diff.

Unrelated unstaged working state (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `report-0a3966d1.md`) was not touched. It is not part of the cherry-picked commit.
