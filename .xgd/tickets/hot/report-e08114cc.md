---
uid: report-e08114cc
id: REPORT-6349
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:07:46.798680+00:00'
updated_at: '2026-10-05T04:07:46.798680+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` (BUG-42): intent/bookkeeping ticket (§2e). Ours is a strict superset, so ours wins.
  The pick is `3df770050c` (2026-09-01 14:16:53 -0700). Blobs: base `040ee98c5a` (the previous pick's theirs) / ours `89395722bc` (== `HEAD:<path>`) /
  theirs `db7db2f796`. Theirs' whole delta from base: `updated_at` → 09-01T21:16:53, `last_field_updated` → `story_points`,
  and it adds `story_points: 3`. Ours already has `story_points: 3`. Its `last_field_updated: status` comes from a later write
  (09-19 `updated_at`, `free_and_reconciled`, `completed_at`, `bundled_in: bundle-8e1807f6`). Resolved with
  `git checkout --ours` + `git add --sparse`. This leaves zero net change from HEAD, and `git status --porcelain` is empty.

## Incoming changes preserved

No code files were involved. The one fact this pick adds (`story_points: 3`) is already in ours, byte for byte.

## Forecast

Later picks on bug-034bf955 should resolve `--ours`, except the incoming tip (09-19, blob `49266c45a3`). The tip wins
`updated_at` by 18.8 s, and every other field is identical.
