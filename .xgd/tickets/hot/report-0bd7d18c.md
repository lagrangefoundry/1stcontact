---
uid: report-0bd7d18c
id: REPORT-7427
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:54:35.512858+00:00'
updated_at: '2026-11-01T06:54:35.512858+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48), intent/bookkeeping ticket (rule 2e). It is outside the sparse cone, so it was resolved index-only to the HEAD blob 7afcdf5c (stage 0, skip-worktree flag restored).
  - Incoming 37d6abdc ("update bug bug-cb59cc4a") changes only `status: draft -> free_coding`, `updated_at: 2026-09-03T02:44:26`, `last_field_updated: status`.
  - HEAD changes the same facts to the later state: `status: bundled`, `updated_at: 2026-11-01T05:18:03`. HEAD also adds `commits`, `version: 0.2.60`, `bundled_in: bundle-94dbe947` and the S1-S6/C1-C4 scoped-behaviour body sections.
  - Same-field conflict, so the later side wins per fact. HEAD is later by timestamp (2026-11-01 vs 2026-09-03) and in lifecycle order (free_coding precedes bundled). HEAD also covers every other fact the incoming commit touches.

## Incoming changes preserved

The incoming commit is a status-only transition (draft -> free_coding) that is already superseded on HEAD: the ticket has moved on through free_coding to bundled. Applying it would roll BUG-48 back from bundled. The resolution therefore nets to no diff vs HEAD (redundant commit, not discarded developer code). No code files were involved.

## Flag for post-merge review

The enrichment's resolution rule asked for this file to be flagged. HEAD's version was kept as the more recent state.
