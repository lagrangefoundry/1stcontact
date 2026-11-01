---
uid: report-1a0a2bb5
id: REPORT-7409
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:44:54.896435+00:00'
updated_at: '2026-11-01T06:44:54.896435+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-597b41d2.md` (BUG-46): intent/bookkeeping ticket (2e), UU, outside the sparse cone. Kept OURS (HEAD) with `git checkout --ours` and `git add --sparse`.
  - The markdown body is byte-identical on both sides. Only the frontmatter differs.
  - HEAD is a strict superset of the incoming side and also the more recent one: updated_at 2026-11-01T05:03:20, status `free_and_reconciled`, completed_at set, commit 3 reconcile_sha `171db310…`, `working_sha_history` fields, `bundled_in: bundle-fd009b93`.
  - Incoming (321ff611e5) is a stale update from 2026-09-03T01:52:41 with status `free_coded`, completed_at null and no reconcile or bundle data. Taking it would move the ticket's lifecycle backwards.
  - This also satisfies the enrichment rule "take the more recent commit by timestamp". Flagged here for post-merge review as that rule requires.

## Incoming changes preserved

There are no code files. Everything the incoming commit says about this ticket is already in HEAD or has been superseded by later state (free_coded → free_and_reconciled). The resolution has no diff against HEAD, so the commit is redundant and nothing was discarded. Finalize should detect the empty staged diff and skip the commit.
