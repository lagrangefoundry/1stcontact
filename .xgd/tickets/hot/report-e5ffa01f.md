---
uid: report-e5ffa01f
id: REPORT-6219
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:53:52.855949+00:00'
updated_at: '2026-10-05T02:53:52.855949+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

`.xgd/tickets/hot/request-6893f6ea.md` (REQ-158), cherry-pick `56209e4238`
(2026-08-31 18:16:45 -0700, `xgd(ticket): update request request-6893f6ea`). UU.

Blobs: base `b6655afd4b`, ours `7cd88f9ec4` (== `HEAD:<path>`), theirs `a14aec29f7`.

## Analysis

- base→theirs: `updated_at` → 09-01T01:16:45, `last_field_updated` → `body`, and the body
  gains a blank line plus a lone `-` bullet after the final open question. Nothing else.
- ours vs `xgd-working:<path>` (incoming's own tip): frontmatter only (the 09-11
  `free_and_reconciled` flip). The bodies are byte-identical, and the tip has no stray
  `-` bullet. So incoming itself dropped this pick's body change later, and ours already
  has incoming's final body.
- ours is the 09-09 `bundled` re-bundle state (`updated_at` 09-09, later than theirs' 09-01).

## Resolution

`git checkout --ours` + `git add --sparse`. Net change from HEAD is zero. CHERRY_PICK_HEAD is
still intact. Same outcome as this ticket's previous picks `14fab3a5d9` and `b5230a9665`.

## Forecast

Later REQ-158 picks before the 09-09 re-bundle should resolve `--ours`. The tip `f74da06627`
(09-11 `free_and_reconciled`) should not.
