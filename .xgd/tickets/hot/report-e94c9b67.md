---
uid: report-e94c9b67
id: REPORT-6351
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:09:26.150882+00:00'
updated_at: '2026-10-05T04:09:26.150882+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

Pick `05ef55a713` (2026-09-01 14:20:15 -0700, `xgd(ticket): update bug bug-034bf955`), HEAD `7ef32ed2d6`.
One path, UU: `.xgd/tickets/hot/bug-034bf955.md` (BUG-42).

Blobs: base `db7db2f796`, ours `89395722bc` (== HEAD), theirs `b42fd97aab`, xgd-working tip `49266c45a3`.

## Analysis

Theirs changes only frontmatter compared with base: `updated_at` goes to 09-01T21:20:15, `last_field_updated` becomes `status`, and `status` goes from `free_coded` to `ready_to_reconcile`.

Ours is a later lifecycle state of the same ledger. It has `status: free_and_reconciled`, `completed_at` 09-14T10:29:07.362661, `bundled_in: bundle-8e1807f6`, `updated_at` 09-19, and the same `last_field_updated: status`. Its body is identical.

The xgd-working tip differs from ours on one line only: `updated_at`, which is 18.8 s later. So incoming's own ledger moves past this pick's `ready_to_reconcile` to the state ours already holds. Nothing in this pick is lost.

## Resolution

`git checkout --ours` followed by `git add --sparse`. This leaves zero net change from HEAD. `git status --porcelain` is empty, and CHERRY_PICK_HEAD is intact.

## Forecast

Later bug-034bf955 picks up to the 09-19 tip should also resolve `--ours`. The tip is the exception: it wins `updated_at` only.
