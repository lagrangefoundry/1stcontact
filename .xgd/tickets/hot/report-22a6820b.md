---
uid: report-22a6820b
id: REPORT-7309
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:46:56.944684+00:00'
updated_at: '2026-11-01T05:46:56.944684+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-43ce519b.md`: intent/bookkeeping ticket (2e, request). Resolved by keeping HEAD's version (`git checkout --ours` + `git add --sparse`).
  - HEAD is a strict superset in content and newer in state: status `free_and_reconciled`, completed_at 2026-10-30, plus the `commits`, `version: 0.2.46` and `bundled_in: bundle-5607a08d` fields.
  - Incoming 4708e7c56f (2026-09-02) is an earlier body edit with frontmatter status `free_coding`. Taking it would have moved the ticket's status backwards.
  - Body text of both sides compared via index stages :2/:3. They are identical apart from one extra blank line after the frontmatter (incoming) and a trailing newline at EOF.

## Incoming changes preserved

- The incoming commit's body changes are already in HEAD word for word: the "decided: accept on read" section, the preamble/CARETAKER_PURPOSE paragraphs and the rename-guard paragraph. The commit is redundant on this branch rather than discarded (BUG-1109/BUG-1122 shape).
- Only whitespace and the stale frontmatter (status/updated_at/last_field_updated) were dropped; the later-timeline HEAD values win per fact.
- The staged diff against HEAD is empty, so the finalize step should skip the commit.
- No code files were involved.
