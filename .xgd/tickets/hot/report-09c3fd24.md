---
uid: report-09c3fd24
id: REPORT-7429
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:55:21.815597+00:00'
updated_at: '2026-11-01T06:55:21.815597+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48), intent/bookkeeping ticket (rule 2e). It is outside the sparse cone, so it was resolved index-only to the HEAD blob 7afcdf5c (stage 0, skip-worktree flag restored).
  - Incoming 7a49f671 ("update bug bug-cb59cc4a") appends the "Scoped behaviour (agreed with the operator before coding)" section S1-S6. It also sets `last_field_updated: body` and `updated_at: 2026-09-03T02:44:26.593`, with status still `free_coding`.
  - HEAD is a strict superset of the incoming content: diffing incoming against HEAD, the only incoming lines missing from HEAD are those three frontmatter scalars. For each of them HEAD holds the later value (`status: bundled`, `updated_at: 2026-11-01T05:18:03`, `last_field_updated: status`). HEAD also carries the C1-C4 section and the bundling fields (`commits`, `version`, `bundled_in`).
  - Same-field scalars: the later side wins per fact (HEAD). Body: superset rule (HEAD).

## Incoming changes preserved

The S1-S6 body section added by the incoming commit is present verbatim in the resolved (HEAD) version. The only incoming values not kept are superseded frontmatter scalars. The resolution nets to no diff vs HEAD (redundant commit, not discarded content). No code files were involved.

## Flag for post-merge review

The enrichment's resolution rule asked for this file to be flagged. HEAD's version was kept as the later state and as a superset of the incoming body.
