---
uid: report-f0f73c88
id: REPORT-5995
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:02:24.436118+00:00'
updated_at: '2026-10-04T22:02:24.436118+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution: request-b474390f / b8b49733ed

- Pick: `b8b49733ed` (2026-08-23 19:10:41 -0700), "xgd(ticket): update request request-b474390f"
- Path: `.xgd/tickets/hot/request-b474390f.md` (UU)
- HEAD: `d5678200bb`
- Blobs: base `9c802367c6` / ours `0d01e4a86d` (== HEAD blob) / theirs `dca7640011`

## Analysis
Theirs' whole delta from base is frontmatter: `updated_at` → 08-24T02:10:41,
`status` `ready_to_reconcile` → `bundled`, and an added `bundled_in: bundle-b3b7c399`.

`git diff :2: xgd-working:<path>` is EMPTY. Ours is byte-identical to incoming's
own tip, which already has `bundled_in: bundle-b3b7c399` and has moved the ticket on to
`status: free_and_reconciled` with `completed_at`/`updated_at` 2026-08-31T14:22:40.
That means the pick's output is already contained in ours, and later incoming
commits supersede its `status`/`updated_at` writes. This matches the request-18a48d63 /
`8aa14a9061` pick from the same 08-23 19:10 bundling batch.

## Resolution
`git checkout --ours` + `git add --sparse`. The net change from HEAD is zero
(`git status --porcelain` is empty) and CHERRY_PICK_HEAD is still in place. No code paths were involved.
