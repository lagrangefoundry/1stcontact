---
uid: report-b6137c94
id: REPORT-5964
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:42:21.460744+00:00'
updated_at: '2026-10-04T21:42:21.460744+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: doc-5ecc3343 / e9418de5e0

Pick: `e9418de5e0` (author 2026-08-23 13:05:31 -0700, "xgd(ticket): update doc doc-5ecc3343").
HEAD: `d5678200bb`. Apply target / publish tip: `397daf02997f5670ac4ce7c26f12ed9050b0f66d`.
Conflict: `AA` on `.xgd/tickets/hot/doc-5ecc3343.md`.

## Diagnosis

AA is the BUG-904 strip artifact: the pick's parent is `0d11a0146e` (strip of
`.xgd/tickets`), so there is no merge base. Shared ancestor is `265ccfa4ff` (08-15).

This is the mirror (already-replayed) shape:

- HEAD's history: `265ccfa4ff` → `3bffc7c494` (08-23 13:05:31, same subject and author
  date as the pick) → `30c47c0f53` (08-31 12:43:21).
- `:3:` (theirs, `947eac3c24`) == `3bffc7c494:<path>` byte-for-byte. HEAD already
  holds an exact replay of this pick.
- `:2:` (ours, `720b006506`) == `HEAD:<path>` == `30c47c0f53:<path>` ==
  `xgd-working:<path>` (incoming's own tip, `e873d500f1`, 08-31 12:43:21). The diff
  between ours and incoming's tip is empty.

So ours is the linear successor of theirs, and incoming has nothing that HEAD lacks.

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD
(`git status --porcelain` empty), CHERRY_PICK_HEAD intact, HEAD unmoved.

## Forecast

The next pick on this path is `e873d500f1` (08-31), and HEAD already holds its blob
via `30c47c0f53`. Expect `--ours` (or a clean auto-merge) with zero net change.
