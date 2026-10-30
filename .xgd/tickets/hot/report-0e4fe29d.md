---
uid: report-0e4fe29d
id: REPORT-6268
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:19:01.855729+00:00'
updated_at: '2026-10-05T03:19:01.855729+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

`.xgd/tickets/hot/request-26dafd83.md` (REQ-165), from picking `f034eeee18` (2026-09-01 11:31, which appends the "What landed" body section and resolves the granularity open question).

Blobs: base `6ec1ac7a93`, ours `139d346878` (== HEAD), theirs `8c223f3766`.

## Resolution: `--ours`, zero net change

- `git diff --stat 139d346878 0fcce92f07:<path>` is EMPTY. Ours is byte-identical to xgd-working's 09-09 re-bundle into `bundle-87be4669`.
- `git diff :3: :2:` shows frontmatter changes plus the EOF newline only, so ours' body already contains theirs' whole "What landed" section and the dropped open question. Ours' frontmatter is newer: `bundled` 09-09, commits, version 0.2.31 and `bundled_in`.
- Ours differs from the xgd-working tip only by the later 09-11 `free_and_reconciled` flip, which a later pick carries.

`git status --porcelain` is empty after the resolution, CHERRY_PICK_HEAD is intact and HEAD has not moved (`1543af3c11`).

## Forecast

The remaining pre-09-09 REQ-165 picks should resolve `--ours`. The tip `c365180050` (09-11) is NOT `--ours`.
