---
uid: report-cc5adbdf
id: REPORT-6245
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:07:37.274854+00:00'
updated_at: '2026-10-05T03:07:37.274854+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution: request-119dd4af (REQ-159) / f3c81c5df5

Picked commit: `f3c81c5df5` (2026-08-31 20:36:06 -0700, "xgd(ticket): update request request-119dd4af").
Conflicted path: `.xgd/tickets/hot/request-119dd4af.md` (UU, ticket path).

## Three sides
- base `:1:` `2218e0bdf7`: `free_coded`, updated_at 08-31T22:18
- ours `:2:` `97468957db` (== `HEAD:<path>`): `bundled`, `bundled_in: bundle-87be4669`, updated_at 09-09T21:32
- theirs `:3:` `9a3549531d`: `ready_to_reconcile`, updated_at 09-01T03:36, drops the EOF newline

## What theirs changes
Frontmatter only: `updated_at`, `last_field_updated: body→status`, `status: free_coded→ready_to_reconcile`.
It also drops the trailing newline. The body is otherwise unchanged.

## Why ours wins
- `git diff --stat :2: 294d87111c:<path>` is EMPTY. Ours is byte-identical to xgd-working's own
  09-09 re-bundle into `bundle-87be4669`. That re-bundle came after this pick and replaced its
  `ready_to_reconcile` status.
- `git diff :2: xgd-working:<path>` contains only the 09-11 `free_and_reconciled` flip (`updated_at`,
  `completed_at`, `status`), which is a later pick.
- `git diff :3: :2:` contains only the superseded status/timestamp, plus ours' `bundled_in` and EOF newline.
  Ours loses nothing.

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD.

## Forecast
Every later REQ-159 pick up to `294d87111c` (09-09 re-bundle) is `--ours`.
The xgd-working tip `b354b050e7` (09-11, `free_and_reconciled` + `completed_at`) is NOT `--ours`.
