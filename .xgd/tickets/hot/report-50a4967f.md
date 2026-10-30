---
uid: report-50a4967f
id: REPORT-5985
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:57:41.910365+00:00'
updated_at: '2026-10-04T21:57:41.910365+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d

Pick `6788b08404` (2026-08-23 18:14:03 -0700, `xgd(ticket): update request request-18a48d63`) onto HEAD `d5678200bb`.

## Conflict
`.xgd/tickets/hot/request-18a48d63.md` (UU). Base `d947f1f99a` / ours `9a0a98ce5d` (== HEAD blob) / theirs `2202404712`.

- base→theirs: frontmatter only. `updated_at` → 08-24, `last_field_updated: commits`, and folds the second `commits` entry (`7ebc721b83`) into the first entry's `working_sha_history`.
- theirs→ours: ours already has that exact `commits` list. It differs only in `updated_at` / `completed_at` (08-31), `status: free_and_reconciled` (theirs: `ready_to_reconcile`), `last_field_updated: status`, and `bundled_in: bundle-b3b7c399`.
- `git diff :2: xgd-working:<path>` is **empty**: ours is byte-identical to incoming's own tip, so incoming already holds this state and nothing from the pick is lost.

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD (`git status --porcelain` is empty), and CHERRY_PICK_HEAD is intact.

The enrichment's "more recent by timestamp" rule gives the same answer: ours' `updated_at` 08-31 is later than theirs' 08-24.

## Forecast
Any later pick on this ticket from before 08-31 should also go `--ours`. Check by running `git diff :2: xgd-working:<path>` first.
