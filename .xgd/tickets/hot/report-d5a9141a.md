---
uid: report-d5a9141a
id: REPORT-6255
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:13:00.299415+00:00'
updated_at: '2026-10-05T03:13:00.299415+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

Pick `0d47d0c43a` (2026-09-01 11:09:26 -0700, "xgd(ticket): update request request-3bc4b835"), path
`.xgd/tickets/hot/request-3bc4b835.md` (REQ-167), UU.

- base `2b8dcbd1a4` → theirs `0b0d4107ce`: frontmatter only — `updated_at` → 09-01T18:09:26,
  `last_field_updated` → status, `status` `free_coded` → `ready_to_reconcile`.
- ours `ec7bfaafc8` (== HEAD blob) is byte-identical to xgd-working's 09-09 re-bundle `57398a6649`
  (`status: bundled`, `bundled_in: bundle-87be4669`, `updated_at` 09-09).
- `git diff :2: xgd-working:<path>` shows only the 09-11 `free_and_reconciled` flip (`392ef4fc5f`), a later pick.

## Resolution

`git checkout --ours` + `git add --sparse`. Theirs' `ready_to_reconcile` write is superseded by incoming's own
09-09 re-bundle, which ours already is. Zero net change from HEAD; `git status --porcelain` empty,
CHERRY_PICK_HEAD intact.

## Forecast

Remaining REQ-167 picks before the tip (the 09-09 status-flip/unbundle/re-bundle trio) are `--ours`.
The tip `392ef4fc5f` (09-11 `free_and_reconciled`) is NOT `--ours`.
