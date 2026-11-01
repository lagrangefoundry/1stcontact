---
uid: report-4ddad66d
id: REPORT-7433
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:01:11.999493+00:00'
updated_at: '2026-11-01T07:01:11.999493+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48) — intent/bookkeeping ticket (2e). UU, index-only (sparse cone). Rule: one side is a strict superset → keep the superset. Resolved to OURS (HEAD, blob 7afcdf5c).
  - Bodies on both sides are byte-identical; only frontmatter differs.
  - Ours: `status: bundled`, `updated_at: 2026-11-01T05:18:03Z`, `bundled_in: bundle-94dbe947`, commits = f00bf269, 4b2ba3ea, 25982452.
  - Theirs (55f4ed3493 "update bug bug-cb59cc4a"): `status: free_coded`, `updated_at: 2026-09-03T03:24:13Z`, commits = f00bf269, 25982452, no `bundled_in`.
  - Every fact theirs introduced over base (free_coded transition, commits list, version 0.2.60) is already present in ours, which further advanced it. This also matches the enrichment rule (take the more recent commit by timestamp).

## Incoming changes preserved

No code files in conflict. The incoming commit's effect (status advance from free_coding, commit list, version) is already contained in HEAD in a later form, so the resolution nets to no diff vs HEAD — a redundant commit, not a discard. Left for finalize to skip; `--skip`/`--continue` not called.

Note: the resolution step cleared the sparse skip-worktree bit, so the file was restored to the working tree with `git checkout --ours` to avoid a spurious deletion showing up. Index entry is stage 0, blob 7afcdf5c (== HEAD).

Flag for post-merge review per enrichment rule (intent unknown on ours side).
