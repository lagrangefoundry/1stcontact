---
uid: report-eef1dcaf
id: REPORT-6221
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:54:50.235985+00:00'
updated_at: '2026-10-05T02:54:50.235985+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

Pick `9331c1feb4` (2026-08-31 18:18:52 -0700, "xgd(ticket): update request request-3bc4b835"),
one path in conflict (UU): `.xgd/tickets/hot/request-3bc4b835.md`.

- base `:1:` f4f016d9e3 / ours `:2:` ec7bfaafc8 (== HEAD blob) / theirs `:3:` 0b7b530d0a

## Analysis

- base→theirs touches frontmatter only: `status` draft→free_coding, `last_field_updated`
  created_at→status, `updated_at`→2026-09-01T01:18:52.
- Ours is the 09-09 `bundled` state (`updated_at` 2026-09-09T21:32:50), which is later in
  the lifecycle than this pick.
- `git diff :2: xgd-working:<path>` contains only the later 09-11 `free_and_reconciled` flip
  (`updated_at`/`completed_at`/`status`). Incoming's own later history supersedes the
  `free_coding` write, and ours already has every other fact.

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD (`git status --porcelain`
empty), CHERRY_PICK_HEAD intact. No data loss, because the pick's only content is a lifecycle
transition that ours has already moved past.

## Forecast

Later picks on request-3bc4b835 before the 09-09 re-bundle `57398a6649` are expected to go `--ours`.
The xgd-working tip `392ef4fc5f` (09-11 `free_and_reconciled`) is NOT `--ours`.
