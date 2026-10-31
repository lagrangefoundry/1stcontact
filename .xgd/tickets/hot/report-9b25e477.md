---
uid: report-9b25e477
id: REPORT-7027
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:08:47.314183+00:00'
updated_at: '2026-10-31T22:08:47.314183+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` (REQ-157). Class: intent/bookkeeping ticket (2e: request). The file is outside the sparse cone, so the conflict was index-only. Resolved with `git checkout --ours` then `git add --sparse`.
  - Incoming 8c444d581d (2026-09-02 13:50:27) is a body rewrite. It:
    - bumps `updated_at`;
    - rewrites AC5 to name the five verdicts;
    - adds the "Decisions (design session, 2026-09-02)" and "Test approach" sections;
    - deletes the "Field evidence" section appended 14 seconds earlier.
  - Every addition is already in HEAD, word for word: AC5 five verdicts, Decisions, Test approach. HEAD's front matter (`free_and_reconciled`, 2026-10-30) is newer than the incoming `updated_at`.

## Incoming changes preserved

- No code files were involved.
- All of the incoming commit's additions are present in HEAD. The staged diff against HEAD is empty: the commit is redundant (BUG-1109/BUG-1122 shape), so finalize should skip it.

## Arbitration of last resort (BUG-1460)

- File: `.xgd/tickets/hot/request-3f8737f2.md`. Dropped hunk: the incoming deletion of the "Field evidence" section.
- Tier 1 (most recent intent) decides it. HEAD's later edit of the same ticket explicitly calls that deletion accidental and reverses it: "Restored: this section was overwritten by a body rewrite fourteen seconds after it was appended, and is reinstated here verbatim apart from its closing note, which had gone stale."
- Result: the deletion is dropped and HEAD's restored section is kept.
