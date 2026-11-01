---
uid: report-ff71f312
id: REPORT-7497
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:40:29.930044+00:00'
updated_at: '2026-11-01T07:40:29.930044+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184): intent/bookkeeping ticket (class 2e; enrichment rule "take the more recent commit by timestamp"). Resolved to OURS (HEAD) with `git checkout --ours` and `git add --sparse`; the file is outside the sparse cone, so the conflict was index-only.
  - Incoming 94d4edc048 (2026-09-04) changed only frontmatter: `status` draft -> free_coding, `updated_at` 2026-09-04T23:58, `last_field_updated` body -> status. Its body is byte-identical to the merge base.
  - HEAD has the later state of the same ticket: `updated_at` 2026-11-01T05:18, `status: bundled`, plus `story_points: 3`, `commits`, `version: 0.2.66`, `bundled_in: bundle-94dbe947` and the rewritten post-implementation body.
  - Both sides changed the same facts (status, updated_at). HEAD's values are later, so HEAD wins per fact. The incoming commit touches no other fields or sections that could be kept.

## Incoming changes preserved

No code files were involved. The incoming commit's only change is the draft -> free_coding status move, which HEAD's later history already went past (free_coding -> ... -> bundled). The commit is redundant, not discarded. The staged result has no diff against HEAD, so the finalize step should skip this commit as empty.

Flagged for post-merge review per the enrichment rule. The resolution is low risk: it keeps the newer state of the ticket.
