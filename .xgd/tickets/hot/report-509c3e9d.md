---
uid: report-509c3e9d
id: REPORT-6259
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:14:50.151668+00:00'
updated_at: '2026-10-05T03:14:50.151668+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resolution: comment-cb7fa49c @ c7e875c975 → ours (zero net change)

- Conflict: `UU .xgd/tickets/hot/comment-cb7fa49c.md`, pick `c7e875c975` (2026-09-01 11:14:44 -0700, "update comment comment-cb7fa49c").
- Blobs: base `8da87177ba`, ours `2b72b3d728`, theirs `bb88e97e23`.
- Ours == `HEAD:<path>` == `xgd-working:<path>` (the incoming tip) — HEAD already carries incoming's final transcript.
- `git diff --numstat :2: :3:` = `1 181`: theirs is a strict prefix of ours; its only unique line is an older `updated_at` (2026-09-01T18:14:44). Taking theirs would drop 181 transcript lines that incoming itself later wrote.
- Resolution: `git checkout --ours` + `git add --sparse`. No data loss; zero net change from HEAD.
- Forecast: further picks on this transcript up to the xgd-working tip resolve the same way (`--ours`), since ours == tip.
