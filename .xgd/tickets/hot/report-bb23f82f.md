---
uid: report-bb23f82f
id: REPORT-6017
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:14:22.530090+00:00'
updated_at: '2026-10-04T22:14:22.530090+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — intent/bookkeeping ticket (§2e), UU. Pick `0941885b7b` (2026-08-25 16:28:09 -0700).
  Blobs: base 5db68a017b (= previous pick 163924e9fd's theirs) / ours 385c6b124d (== HEAD, unchanged) / theirs 4fc9bbb960.
  Theirs' delta: adds `commits: [working_sha 759cd874…]` and `version: 0.2.15` (both byte-identical on ours),
  `last_field_updated: status` (same on ours), `status: free_coding → free_coded` and `updated_at` 08-25
  (ours leads: `bundled` / 08-31), and drops the trailing newline.
  Ours is a strict superset on every fact → `git checkout --ours` + `git add --sparse`. Zero net change from HEAD.

## Incoming changes preserved

No code files. Every value this pick adds is already present on ours; its `free_coded` status is superseded by
ours' later `bundled`. `git status --porcelain` empty, CHERRY_PICK_HEAD intact.
