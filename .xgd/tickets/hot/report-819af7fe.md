---
uid: report-819af7fe
id: REPORT-6249
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:10:15.498434+00:00'
updated_at: '2026-10-05T03:10:15.498434+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution — request-909e42f8 (REQ-164) / a4e81f7825

Picked commit: `a4e81f7825` (2026-08-31 20:36:07 -0700), "xgd(ticket): update request request-909e42f8".

## Conflict
`UU .xgd/tickets/hot/request-909e42f8.md`. Base `6d112a2b75`, ours `3b6c6a92fb` (== `HEAD:<path>`), theirs `abf84be948`.

Theirs' whole delta from base touches frontmatter only: `updated_at` → 2026-09-01T03:36:07, `last_field_updated` → status, and `status` `free_coded` → `ready_to_reconcile`. It also drops the EOF newline.

## Resolution: `--ours`, zero net change
`git diff --stat 3b6c6a92fb 5a60c25f99:<path>` is EMPTY. So ours is byte-identical to xgd-working's own 09-09 re-bundle (`5a60c25f99`: `status: bundled`, `bundled_in: bundle-87be4669`). That re-bundle comes after this pick, so incoming itself superseded the `ready_to_reconcile` write. Nothing from incoming is lost.

`git checkout --ours` + `git add --sparse`. `git status --porcelain` is empty, CHERRY_PICK_HEAD is intact and HEAD has not moved.

## Forecast
The picks after this one, through `5a60c25f99`, are expected to resolve `--ours`. The tip `44947863ce` (09-11, `free_and_reconciled`) is NOT expected to be `--ours`.
