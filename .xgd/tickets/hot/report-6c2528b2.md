---
uid: report-6c2528b2
id: REPORT-7421
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:51:06.716903+00:00'
updated_at: '2026-11-01T06:51:06.716903+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-72001560.md` (REQ-171): intent/bookkeeping ticket (rule 2e). I kept ours (`git checkout --ours` + `git add --sparse`). The file was outside the sparse cone and the conflict existed only in the index.

## Incoming changes preserved

The incoming commit c9af761 ("update request request-72001560") changes only front matter:
- `status` from draft to free_coding
- `last_field_updated` to status
- `updated_at` to 2026-09-03T02:38:39
- it drops the trailing newline

HEAD changed the same `status` field later in the ticket's lifecycle: `status: bundled`, `updated_at` 2026-11-01T05:18:03, plus `bundled_in: bundle-94dbe947`, `version: 0.2.58` and the `commits` list. HEAD already has `last_field_updated: status` and no trailing newline.

`status` is the same fact changed differently on each side. HEAD's value comes from the later intent (bundling follows free_coding), so ours is kept for that fact. Every other incoming change is already present in HEAD. The resolution stages no diff vs HEAD (a redundant commit, BUG-1109/BUG-1122 shape). It also matches the enrichment's "take the more recent" rule.
