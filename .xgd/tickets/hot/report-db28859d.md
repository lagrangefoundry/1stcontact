---
uid: report-db28859d
id: REPORT-7123
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:11:31.322471+00:00'
updated_at: '2026-10-31T23:11:31.322471+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-631866be.md` (REQ-177): intent/bookkeeping ticket (2e). Rule applied: per-fact, later value wins.
  - Incoming e7a9ab689a (Sep 2 2026, "update request") adds the `## What landed` and `## Test plan` body sections, changes `last_field_updated: status→body`, bumps `updated_at`, and adds a trailing newline.
  - The body hunk merged without conflict. Only the frontmatter conflicted: updated_at, completed_at, last_field_updated, status.
  - For all four frontmatter facts I kept HEAD (2026-10-30, `status: free_and_reconciled`, completed_at set). HEAD's values are later than incoming's Sep 2 `free_coded`/body-edit values, which matches the enrichment rule "take the more recent commit by timestamp".
  - Staged with `git add --sparse`.

## Incoming changes preserved

No code files were involved. The incoming body sections ("What landed", "Test plan") are present in the resolved file; HEAD already had identical text. The trailing-newline fix from incoming is also kept, and is the only net staged diff vs HEAD (1 line). The incoming frontmatter values were dropped only because later lifecycle transitions on HEAD have replaced them.

## Post-merge review flag

The enrichment marked intent as unknown on both sides. Please flag request-631866be for a quick post-merge check that its status is `free_and_reconciled`.
