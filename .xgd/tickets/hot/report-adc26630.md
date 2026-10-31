---
uid: report-adc26630
id: REPORT-6937
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:12:53.737387+00:00'
updated_at: '2026-10-31T21:12:53.737387+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` (REQ-156): intent/bookkeeping ticket (rule 2e). Kept the HEAD side, which is a strict superset and the later state. Two hunks:
  - Frontmatter: HEAD `updated_at 2026-09-16T01:48:38`, `completed_at 2026-09-14T10:29:03`, `status: bundled` vs incoming `updated_at 2026-09-01T22:10:38`, `completed_at: null`, `status: free_coded`. HEAD is the later lifecycle state; incoming is an earlier snapshot.
  - `fields.commits`: HEAD has the same three working_shas (f5807330, 92e927e7, d612c1aa) plus `working_sha_history: []`, `reconcile_sha: e86aecc7` on d612c1aa, and `bundled_in: bundle-8e1807f6`. Incoming has none of these.
  - Resolved file is identical to HEAD (`git diff HEAD` is empty).

## Incoming changes preserved

There are no code files in this conflict. The incoming commit 56087d83b3 (2026-09-01, "xgd(ticket): update request request-51514090") only touches this ticket. Its facts (status free_coded, the three commit SHAs, version 0.2.39) are already in HEAD's later state, which advanced past them. The commit is redundant, not discarded. The staged diff vs HEAD is empty, so finalize should skip it. Flagged for post-merge review per the enrichment rule ("take the more recent commit by timestamp").

Unrelated working-tree changes were left untouched: `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, and untracked `.xgd/tickets/hot/report-e75364f8.md`.
