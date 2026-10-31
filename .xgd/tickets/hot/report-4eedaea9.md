---
uid: report-4eedaea9
id: REPORT-6975
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:36:31.991303+00:00'
updated_at: '2026-10-31T21:36:31.991303+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e). Rule: superset / later state per fact. Conflicted frontmatter facts (updated_at, completed_at, status; story_points/bundled_in) resolved to HEAD: status `free_and_reconciled` (2026-10-30), completed_at set, story_points 3, bundled_in bundle-5607a08d. Incoming 2f771ca6e2 (2026-09-02) set status `free_coded` — an earlier lifecycle state that HEAD has already advanced past; taking it would regress the ticket.

## Incoming changes preserved

- Incoming diff: status free_coding→free_coded, updated_at bump, added `fields.commits` (working_sha fd6aa2bf39…) and `fields.version: 0.2.41`. `commits` and `version` are present in the resolved file (already in HEAD). The status/updated_at values are superseded by HEAD's later reconciled state. Resolved file is identical to HEAD — commit is redundant (effect already landed); finalize step should skip it as a clean staged diff.
- Flag for post-merge review per enrichment rule (intent unknown on both sides); low risk — bookkeeping only.

Note: the recent history shows repeated "recover uncommitted .xgd/ state from interrupted cherry-pick (BUG-603)" / "update bundle bundle-fd009b93" commits, suggesting this cherry-pick window may be looping.
