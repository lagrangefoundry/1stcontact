---
uid: report-082c5c23
id: REPORT-7135
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:18:32.704145+00:00'
updated_at: '2026-10-31T23:18:32.704145+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-597b41d2.md` (BUG-46): intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: strict superset, so kept OURS (HEAD blob 0bbd70d5).
  - The incoming commit 67c8dd3c13 ("update bug bug-597b41d2") changes this file only. Its body is a word-for-word prefix of HEAD's: HEAD has everything incoming added, through "Residual risk on closing", plus three later sections (REQ-114 ticket, REQ-114 shipped / `live` flag, environment note).
  - Incoming frontmatter is stale: status draft, updated_at 2026-09-02, last_field_updated body. HEAD has status bundled, updated_at 2026-10-31, commits, version 0.2.57 and bundled_in bundle-fd009b93. Taking theirs would have rolled the ticket back.
  - The enrichment's fallback rule ("take the more recent commit by timestamp") picks the same side: HEAD's content is the more recent.
  - Resolved via `git update-index --cacheinfo` to stage 0, then restored the sparse skip-worktree bit.

## Incoming changes preserved

No code files were in conflict. For the ticket, every line the incoming commit adds is already in HEAD. The commit is redundant, not discarded. The staged diff against HEAD is empty, so finalize should skip the commit (BUG-1109/1122 shape).

Unrelated pre-existing working-tree state was left untouched and unstaged: `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, and the untracked `.xgd/tickets/hot/report-370aa605.md`.

Post-merge review is flagged per the enrichment rule (intent unknown on the HEAD side), though the superset relationship is unambiguous.
