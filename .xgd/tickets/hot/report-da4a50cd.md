---
uid: report-da4a50cd
id: REPORT-7501
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:43:06.683970+00:00'
updated_at: '2026-11-01T07:43:06.683970+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184): intent/bookkeeping ticket (2e), UU, outside the sparse cone (conflict existed only in the index). Rule: strict superset — kept HEAD (ours, blob 77cbbf8955) via `git update-index --cacheinfo` + skip-worktree restored.
  - Incoming c14fcf45c6 is a stale intermediate snapshot: updated_at 2026-09-05T00:12:49, status `free_coding`, story_points 2→3, body rewritten to past tense ("both landed", subject-column table, test plan).
  - HEAD: updated_at 2026-11-01T05:18:05, status `bundled`, adds `commits` (working_sha 65c38cd5…), `version: 0.2.66`, `bundled_in: bundle-94dbe947`. Its body contains every incoming body edit verbatim, plus retains the "REQ-185 must run after this rename" ordering sentence (present in base, dropped by incoming, kept by the later HEAD state).
  - Also matches the enrichment rule "take the more recent commit by timestamp" — HEAD is ~2 months later.

## Incoming changes preserved

No code files in conflict. Every change incoming made relative to base (story_points 3, past-tense body, subject-column table, memberships rename section, consequences section, rewritten acceptance, test plan) is already present in HEAD's version, so the commit is redundant (BUG-1109/BUG-1122 shape): resolution stages to no diff vs HEAD. Only incoming-side field values not kept are its stale `updated_at`/`last_field_updated`/`status: free_coding`, superseded by HEAD's later bundled state.

Flagged for post-merge review per enrichment rule (intent unknown on both sides), though no content was lost.
