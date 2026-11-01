---
uid: report-26b0e262
id: REPORT-7731
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:40:23.053046+00:00'
updated_at: '2026-11-01T15:40:23.053046+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` — intent/bookkeeping ticket (2e, request). Rule: one side is a strict superset → keep the superset (HEAD / ours). Resolved with `git checkout --ours` + `git add --sparse` (outside sparse cone).

## Incoming changes preserved

The incoming commit 86edcff12f ("xgd(ticket): update request request-407a6fd8", 2026-09-05) is a stale snapshot. Its only changes were:
- frontmatter: `updated_at: 2026-09-05T00:18:38`, `last_field_updated: body` (status still `free_coding`, `completed_at: null`)
- body: appended the "What the amendment landed, and its consequences" section.

HEAD already contains that entire appended section (verified: present in `HEAD:.xgd/tickets/hot/request-407a6fd8.md`), plus later content not on the incoming side ("A fourth commit: REQ-184's UAT lost the same observable"). HEAD's frontmatter is strictly newer (`updated_at`/`completed_at` 2026-11-01, `status: free_and_reconciled`, `story_points: 4`); taking incoming frontmatter would regress the ticket's lifecycle state. The incoming commit's effect is therefore already integrated — resolution nets to no diff vs HEAD (redundant, not discarded). No code files involved.
