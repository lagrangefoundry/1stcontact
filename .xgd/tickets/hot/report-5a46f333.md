---
uid: report-5a46f333
id: REPORT-6193
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:40:06.652880+00:00'
updated_at: '2026-10-05T02:40:06.652880+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

`UU .xgd/tickets/hot/comment-c74424ff.md` while cherry-picking `385c5a1769`
(2026-08-31 17:47:24, "update comment comment-c74424ff") onto HEAD `0c3e2344fb`.

## Evidence

- Blobs: base `361f2f9353`, ours `e463de6c03` (== `HEAD:<path>`), theirs `7369198afa`,
  xgd-working tip `927f4c64ed`.
- `git diff --numstat :2: :3:` = `1 195`. The one line only theirs has is its older
  `updated_at`. The 195 lines only ours has are whole later chat turns (09-01 00:48 to
  18:25). So **theirs is a strict prefix of ours**.
- Ours == `c279b38fee:<path>` (incoming's own 09-01 commit, which HEAD already replayed).
  The picked commit comes before that in incoming's ledger (`385c5a1769` 08-31 17:47 →
  `de4f34e50e` 17:48 → `f0f390668e` 17:52 → … → `c279b38fee` 09-01).

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD and no transcript
turns lost. This is the same inverse-prefix shape as the earlier picks on this transcript
(REPORT-6145 … REPORT-6169).

## Forecast

Picks up to and including `c279b38fee` stay `--ours`. From `d6013f73cf` (09-02) to the tip
`e4eaf3ed55` (09-06), incoming should win.
