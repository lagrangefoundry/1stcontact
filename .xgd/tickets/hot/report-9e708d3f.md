---
uid: report-9e708d3f
id: REPORT-8234
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:49:51.965741+00:00'
updated_at: '2026-11-02T01:49:51.965741+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-ddd47be3.md` — intent/bookkeeping ticket (2e; out of sparse cone, index-only conflict). Resolved to OURS (HEAD) via `git checkout --ours` + `git add --sparse`.
  - Conflict was confined to frontmatter: `updated_at`, `last_field_updated`, `status`.
  - Incoming (e0f0a459ae, 2026-09-06T19:44): `status: free_coded -> ready_to_reconcile`.
  - HEAD (2026-11-01T23:18): `status: bundled`, `bundled_in: bundle-5052a63c` — a later lifecycle stage that already supersedes ready_to_reconcile; HEAD's version also contains the incoming change's effect (status advanced past free_coded).
  - Per the enrichment rule (intent unknown on one side → take the more recent by timestamp), HEAD is more recent. **Flagged for post-merge review** as the enrichment rule requires.
  - Net staged diff vs HEAD: none (redundant commit) — finalize step should detect clean diff and skip.

## Incoming changes preserved

No code files involved. The incoming commit's only change was a status advance out of `free_coded`; HEAD already carries a later status (`bundled`) for the same request, so the incoming intent is subsumed, not discarded.
