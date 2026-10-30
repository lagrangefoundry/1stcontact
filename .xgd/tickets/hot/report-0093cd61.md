---
uid: report-0093cd61
id: REPORT-6026
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:18:59.081601+00:00'
updated_at: '2026-10-04T22:18:59.081601+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

`.xgd/tickets/hot/request-b88b79fe.md` (UU) while cherry-picking `04d4a9841d`
(2026-08-28 09:38:43, `free_coding` → `free_coded`, adds `fields.commits` +
`fields.version: 0.2.16`).

Blobs: base `08535fb908` / ours `36e51a0c74` (== HEAD) / theirs `276781dcf2`.

## Evidence

- base→theirs is frontmatter only: `updated_at`, `status: free_coded`, and the
  `commits` (`working_sha 29c0e86dd3…`) + `version: 0.2.16` block.
- Ours already has that `commits` block and `version` byte-identically, and moves
  further along: `status: bundled`, `bundled_in: bundle-8eef3846`, `updated_at` 08-31.
- Ours == xgd-working's `aae17fd9bf` (08-30 22:05, `bundled`) except for a trailing
  newline. That is a LATER xgd-working commit than this pick, so this pick's values
  are earlier lifecycle states, already superseded on HEAD.
- Ours vs the xgd-working tip `58ba7fca8e` differs only in the 08-31 23:59
  `free_and_reconciled` / `completed_at` flip, which comes in a later pick.

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD.
`git status --porcelain` is empty and CHERRY_PICK_HEAD is intact.

## Forecast

Remaining picks on this ticket: `60dd71c053` (08-28 09:40), `6531a2d1f4`, `3b9156ae89`
(08-30), `aae17fd9bf` (08-30 22:05, blob == ours apart from the newline), then
`--ours`. The tip `58ba7fca8e` (08-31 `free_and_reconciled`) is NOT `--ours`.
