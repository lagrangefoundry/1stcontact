---
uid: report-fbada7c6
id: REPORT-6366
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T07:27:03.295763+00:00'
updated_at: '2026-10-05T07:27:03.295763+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — bug-360c5a44 / ad63102c9a

- Branch `resync-10bbd54c`, HEAD `7ef32ed2d6`, pick `ad63102c9a` (09-01 14:54:36, "xgd(ticket): update bug bug-360c5a44").
- Path: `.xgd/tickets/hot/bug-360c5a44.md` (UU, ticket path).
- Blobs: base `58cd6a31b2`, ours `0f983095aa` (== HEAD), theirs `6bfb11db8a`.

### Analysis
- Theirs' entire delta from base: adds `chat_comment: comment-ab9333e3` (one line).
- Ours already carries `chat_comment: comment-ab9333e3` verbatim, and is a strict superset (title, body, lifecycle through `free_and_reconciled`).
- `git diff :2: xgd-working:<path>` (tip `fca35b86a8`) is exactly one line: `updated_at` 09-19T15:15:41.714382 vs ours' 15:15:28.543268. So incoming's own tip supersedes this pick, and ours matches it on every fact except that timestamp.
- Same blob triple as REPORT-5915 / REPORT-6204 (earlier deliveries of this pick).

### Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD (`git status --porcelain` empty), CHERRY_PICK_HEAD intact.

### Forecast
Later bug-360c5a44 picks (`b6b2cfc512`, `fd72594eb0`, `6862ea1402`, `eb9960199f`, ...) → `--ours`; only the xgd-working tip wins, and only on `updated_at` (+13.2 s).
