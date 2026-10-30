---
uid: report-4bc3780f
id: REPORT-6195
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:41:06.984636+00:00'
updated_at: '2026-10-05T02:41:06.984636+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution: request-78370159 (REQ-161) / 4207df5246

- Picked commit: `4207df5246` (2026-08-31 17:47:45 -0700, "update request request-78370159")
- Path: `.xgd/tickets/hot/request-78370159.md` (UU)
- Blobs: base `47e062511b` / ours `c5565fa271` (== HEAD, unmoved since earlier REQ-161 picks) / theirs `70c125f5b1`

## Analysis
- base→theirs: `updated_at` bump plus one body bullet rewrite (REQ-163's and REQ-162's
  blob-addressing criteria restated).
- theirs→ours: body byte-identical (ours already carries the rewritten bullet) apart from
  ours' missing EOF newline; frontmatter on ours is the later 09-09 `bundled` state
  (`bundled_in: bundle-87be4669`, commits, version 0.2.26, story_points 13).
- ours→xgd-working tip: frontmatter only (the 09-11 `free_and_reconciled` flip, a later pick).

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD; ours is a strict
superset of the picked commit's content.

## Forecast
Remaining pre-09-09 REQ-161 picks: `--ours`. The 09-11 `free_and_reconciled` tip is NOT.
