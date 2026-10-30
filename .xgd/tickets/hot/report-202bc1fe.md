---
uid: report-202bc1fe
id: REPORT-6271
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:20:56.131517+00:00'
updated_at: '2026-10-05T03:20:56.131517+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: request-26dafd83 (REQ-165) / e4ba03047c

Pick: `e4ba03047c` (2026-09-01 11:35:52 -0700, xgd(ticket): update request request-26dafd83).
HEAD `1543af3c11`. Conflict: UU `.xgd/tickets/hot/request-26dafd83.md`.

Blobs: base `8c223f3766`, ours `139d346878` (== HEAD), theirs `719299e885`.

## Analysis
- `git diff :3: :2:` is frontmatter only: `updated_at` (ours 09-09 vs theirs 09-01),
  `status` (ours `bundled` vs theirs `free_coded`), and ours adds `bundled_in: bundle-87be4669`.
  Body, `commits`, and `version: 0.2.31` are byte-identical, so ours already holds everything
  this pick adds (+15/-4 vs base).
- `git diff --stat :2: 0fcce92f07:<path>` is EMPTY. Ours is byte-identical to xgd-working's own
  09-09 re-bundle into bundle-87be4669, which is incoming's later decision that supersedes this
  pick's `free_coded` status.

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD. CHERRY_PICK_HEAD intact.

## Forecast
Later REQ-165 picks through the 09-09 re-bundle `0fcce92f07` are `--ours`. The 09-11 tip
`c365180050` (`free_and_reconciled`) is NOT.
