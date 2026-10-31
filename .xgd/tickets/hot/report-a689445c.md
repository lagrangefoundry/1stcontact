---
uid: report-a689445c
id: REPORT-6991
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:46:00.556552+00:00'
updated_at: '2026-10-31T21:46:00.556552+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` (BUG-44) — intent/bookkeeping ticket (2e). Resolved to HEAD (`git checkout --ours` + `git add --sparse`); staged result is identical to HEAD.
  - Frontmatter: same fields changed on both sides. HEAD (updated 2026-10-30, status `free_and_reconciled`, completed_at set, plus `commits`/`version: 0.2.42`/`bundled_in: bundle-5607a08d`) is a strict superset and the later state; incoming (updated 2026-09-02, status `draft`, completed_at null) is stale and would roll the ticket's lifecycle back. Kept HEAD per the "more recent by timestamp" / superset rule.
  - Body: identical on both sides apart from a trailing newline at EOF — the incoming body edit is already present in HEAD.

## Incoming changes preserved

No code files involved. The incoming commit 0b1db72ad0 ("update bug bug-5bc83942") was a body edit; that body text is already fully present in HEAD, so the commit is redundant (BUG-1109/BUG-1122 shape) and the staged diff vs HEAD is empty. Only its stale frontmatter (status draft, completed_at null) was not applied, because HEAD's later lifecycle state supersedes it. Finalize step is expected to detect the empty diff and skip.
