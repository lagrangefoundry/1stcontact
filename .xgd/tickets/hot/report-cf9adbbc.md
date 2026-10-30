---
uid: report-cf9adbbc
id: REPORT-6157
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:36:17.233651+00:00'
updated_at: '2026-10-04T23:36:17.233651+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resolution: comment-c74424ff / c5153f1079 (2026-08-31 16:53:18) → --ours

- Conflict: UU `.xgd/tickets/hot/comment-c74424ff.md` (append-only transcript), HEAD `c6986ef69e`.
- Blobs: base `5d8e14e145`, ours `e463de6c03`, theirs `254d650140`, xgd-working tip `927f4c64ed`.
- `git diff --numstat :2: :3:` = `1 495`: theirs is a strict prefix of ours; the only line ours lacks is theirs' older `updated_at` (08-31T23:53:18).
- Ours == blob of incoming's own later commit `c279b38fee` (09-01), which HEAD already replayed. Taking theirs would drop ~495 transcript lines.
- Result: `--ours`, zero net change from HEAD.

Forecast (unchanged): remaining picks through `c279b38fee` are `--ours`; from `d6013f73cf` (09-02) through the tip, incoming should win.
