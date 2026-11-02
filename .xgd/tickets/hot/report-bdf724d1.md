---
uid: report-bdf724d1
id: REPORT-8105
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:05:35.533816+00:00'
updated_at: '2026-11-02T01:05:35.533816+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-b6268a25.md` — intent/bookkeeping ticket (2e), outside sparse cone (index-only conflict). Rule: one side is a strict superset → keep the superset. Resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming (2ed75a03f1, "update bug bug-b6268a25") changed only two things vs base: added `fields.chat_comment: comment-36485e09`, and removed the trailing newline at EOF.
  - Ours (HEAD) contains both of those changes identically, plus later bookkeeping (status `bundled`, `bundled_in: bundle-5052a63c`, commits list, version 0.2.82) and the rewritten ticket body (seven call sites, silent document-snapshot failure, revised acceptance).
  - Ours is therefore a strict superset of incoming; no fact was changed differently on both sides, so no timeline arbitration was needed.

## Incoming changes preserved

Both incoming hunks (`chat_comment: comment-36485e09`; no trailing newline) are present in the resolved file. The resolution nets to no diff vs HEAD — the commit is redundant (its effect already landed on HEAD), not discarded. Left for cherry_pick_finalize_resolution to detect the empty staged diff and skip.
