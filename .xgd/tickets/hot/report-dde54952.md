---
uid: report-dde54952
id: REPORT-6019
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:15:24.507302+00:00'
updated_at: '2026-10-04T22:15:24.507302+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — intent/bookkeeping ticket (§2e), UU. Pick `bffb6b34fa` (2026-08-26 11:31:10 -0700).
  Blobs: base 2d6d161713 (= previous pick 7f1350e9a5's theirs) / ours 385c6b124d (== HEAD, unchanged) / theirs ad25504e54.
  Theirs' delta: `status: free_coded → ready_to_reconcile`, `last_field_updated: status` (same on ours), `updated_at` 08-26.
  Ours leads: `status: bundled` / `updated_at` 08-31 (bundling follows ready_to_reconcile; also carries `bundled_in`).
  → `git checkout --ours` + `git add --sparse`. Zero net change from HEAD.

## Incoming changes preserved

No code files. This pick's `ready_to_reconcile` is a transient lifecycle step superseded by ours' later `bundled`.
`git status --porcelain` empty, CHERRY_PICK_HEAD intact.
