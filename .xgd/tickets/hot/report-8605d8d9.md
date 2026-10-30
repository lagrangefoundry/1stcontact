---
uid: report-8605d8d9
id: REPORT-6209
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:48:53.058752+00:00'
updated_at: '2026-10-05T02:48:53.058752+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` (REQ-161) — intent ticket, rule 2e (superset) → `--ours`.
  Pick `60e4959eb7` (2026-08-31 17:54:01 -0700) only bumps `story_points` 8 → 13 (plus `updated_at`/`last_field_updated`).
  - base `c6f18583c5` (= previous pick `139c79dec2`'s theirs), ours `c5565fa271` (== HEAD blob, unmoved), theirs `f8e0364f80`.
  - Ours already carries `story_points: 13`. Theirs vs ours differs only in later facts on ours: `updated_at` 09-09 vs 09-01, `status: bundled`, `bundled_in: bundle-87be4669` (the 09-09 re-bundle state).
  - Zero net change from HEAD `ceed2f3c53`.

## Incoming changes preserved

No code files. The pick's single fact (`story_points: 13`) is present in the resolved ticket.

Forecast: remaining pre-09-11 REQ-161 picks are `--ours`; the 09-11 `free_and_reconciled` tip is NOT.
