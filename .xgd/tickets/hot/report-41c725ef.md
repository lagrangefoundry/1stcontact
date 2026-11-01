---
uid: report-41c725ef
id: REPORT-7379
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:25:43.481027+00:00'
updated_at: '2026-11-01T06:25:43.481027+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178) — class 2e (intent/bookkeeping request ticket). Rule: keep the superset → HEAD (ours). Staged via `git checkout --ours` + `git add --sparse` (path is outside sparse cone).

Incoming b042472bd1 (2026-09-02 17:02:29 -0700) makes two changes: (1) it bumps `updated_at` to 2026-09-03T00:02:29 and sets `last_field_updated: body`; (2) it appends the body section "### A second commit: repairing a raced merge" (68db393777 / package.json 0.2.51 repair). HEAD has a later `updated_at` (2026-11-01) and already contains that same section word for word at line 170, reflowed to unwrapped lines, followed by the later 2026-09-04 amendment and subsequent sections.

## Incoming changes preserved

No code files were involved. The incoming commit's only content change, the "repairing a raced merge" section, is present in HEAD (and so in the resolution) with identical wording. Its frontmatter timestamps are superseded by HEAD's later values. The commit is redundant, not discarded; the staged result has no diff against HEAD.
