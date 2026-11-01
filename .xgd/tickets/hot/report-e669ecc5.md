---
uid: report-e669ecc5
id: REPORT-7495
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:39:09.875507+00:00'
updated_at: '2026-11-01T07:39:09.875507+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` — intent/bookkeeping ticket (request), rule 2e "one side is a strict superset": kept HEAD (ours) via `git checkout --ours` + `git add --sparse` (path outside sparse cone).
  - Incoming 215eb90521 ("update request request-b813aa4a") changed only: `depends_on: [REQ-178]` (added), `updated_at` 2026-09-04T23:57:46, `last_field_updated: depends_on`, and stripped the trailing newline.
  - HEAD already contains `depends_on: [REQ-178]` plus later facts: status `bundled`, `bundled_in: bundle-94dbe947`, story_points 4, version 0.2.69, second working_sha entry, `updated_at` 2026-11-01, and the "Implementation delta" / "Acceptance, in test terms" body sections.
  - HEAD's `updated_at`/`last_field_updated` are newer than incoming's, so taking HEAD for those fields is right per-fact too.

## Incoming changes preserved

No code files were in conflict. The incoming commit's only substantive change (the `depends_on: REQ-178` hard dependency) is already in HEAD, so the commit is redundant (BUG-1109/BUG-1122 shape). The staged diff against HEAD is empty, and finalize is expected to skip the commit. Nothing was dropped under BUG-1301.
