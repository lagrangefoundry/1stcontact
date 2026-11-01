---
uid: report-e61b450e
id: REPORT-7377
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:25:08.702791+00:00'
updated_at: '2026-11-01T06:25:08.702791+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178) — class 2e (intent/bookkeeping request ticket). Rule: keep the superset / the later value per fact → HEAD (ours). Staged via `git checkout --ours` + `git add --sparse` (path is outside sparse cone).

Incoming 5ee061d84e (2026-09-02 17:02:11 -0700) changes only two frontmatter scalars: `updated_at` → 2026-09-03T00:02:11 and `last_field_updated` → story_points. HEAD already has later values for both (`updated_at` 2026-11-01T05:03:20, `last_field_updated: status`), along with status free_and_reconciled, story_points 4, the reconciled commits list, and the amended body. Per fact, HEAD's values are the later ones.

## Incoming changes preserved

No code files were involved. The incoming commit's only effect is a September timestamp bump, which HEAD's November state has since superseded. It is redundant, not discarded. The staged result has no diff against HEAD.
