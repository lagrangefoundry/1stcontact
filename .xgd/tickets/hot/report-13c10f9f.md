---
uid: report-13c10f9f
id: REPORT-5775
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T07:39:51.450436+00:00'
updated_at: '2026-10-02T07:39:51.450436+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — ticket file (REQ-172), cherry-pick of
  `d1453db0b68968328d4be98712d8db455775a7e8` (xgd-working tip for this path) onto
  HEAD `0b51969d2a`. Rule applied: true 3-way merge, per-fact — incoming wins
  `updated_at`, ours keeps its trailing newline.
  - Stages: base `c66d9bfb5e` / ours `284e1e08f9` (== `HEAD:<path>`) / theirs
    `930d6a355a` (== `xgd-working:<path>`).
  - base→theirs: `updated_at` → `2026-09-19T15:15:37.349811`, `status`
    `bundled` → `free_and_reconciled`.
  - base→ours: `updated_at` → `2026-09-19T15:15:29.110241`, `status`
    `bundled` → `free_and_reconciled`, plus a trailing newline at EOF.
  - `status` is byte-identical on both sides (no lifecycle regression possible);
    `completed_at`, `bundled_in` and the body are identical. The only genuine
    divergence is `updated_at`, where incoming is 8.2 s later — taken from
    incoming. This also agrees with the enrichment's "more recent by timestamp"
    rule.
  - Resolved blob `8a18b9ad8e`: ours with the one `updated_at` line replaced.
    Net change from HEAD is +1/−1; diff against `xgd-working:<path>` is the
    trailing newline only. No conflict markers remain.

## Incoming changes preserved

- No code files in this conflict. Every fact the incoming commit writes
  (`updated_at`, `status: free_and_reconciled`) is present in the resolved file.
  Nothing from HEAD was dropped (the only ours-only hunk, the EOF newline, is
  kept).
- This was the last forecast pick for request-8b33a146 (the tip exception
  predicted in REPORT-5621 / REPORT-5687); the path now matches xgd-working's
  tip in content.
- `prior_stage_failure` was empty; retry count 1. Staging is clean
  (`M  .xgd/tickets/hot/request-8b33a146.md` only), `CHERRY_PICK_HEAD` intact.
