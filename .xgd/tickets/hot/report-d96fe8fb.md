---
uid: report-d96fe8fb
id: REPORT-7483
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:31:30.084538+00:00'
updated_at: '2026-11-01T07:31:30.084538+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md`: intent/bookkeeping ticket (request, rule 2e). Resolved to HEAD (ours) using the strict-superset rule, which agrees with the enrichment's "more recent commit by timestamp" rule.
  - Incoming `30e54bed78` (2026-09-04 16:42) appends the body section "Reopened 2026-09-04: admission is membership, not entitlement ([[DOC-42]])". It also sets `last_field_updated: body` and `updated_at` to 2026-09-04, and keeps `status: draft`.
  - HEAD (2026-11-01) already contains that section verbatim; confirmed with `git show HEAD:<path>`. It also contains everything added later: "What the amendment landed", the amendment test plan, the REQ-184 fourth-commit note, `story_points: 4` and `status: free_and_reconciled` with `completed_at` set.
  - In the second hunk, the incoming side is empty; only HEAD has the later sections. Taking the incoming frontmatter would roll the ticket back to a two-month-old draft.

## Incoming changes preserved

No code files were involved. The incoming commit's body addition is already in HEAD, so this is a redundant commit (BUG-1109/BUG-1122). It stages as no diff vs HEAD, and finalize should skip it. This is the same pattern as the previous conflict on this ticket (`1ba93bae9d`, REPORT-7481). Flagged for post-merge review per the enrichment rule, though no follow-up is expected.
