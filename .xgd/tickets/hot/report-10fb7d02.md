---
uid: report-10fb7d02
id: REPORT-6179
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:31:51.259327+00:00'
updated_at: '2026-10-05T02:31:51.259327+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution: comment-0386ff02 / 662bb39823

- Pick: `662bb39823` (2026-08-31 17:21:32 -0700, update comment comment-0386ff02)
- HEAD: `9d4f3d6a78`
- Path: `.xgd/tickets/hot/comment-0386ff02.md` (UU)
- Blobs: base `a0cc9f4565` / ours `424971ebda` / theirs `d8f3bcfd8c`; xgd-working tip `424971ebda`

### Analysis
`git diff --numstat :2: :3:` = `1 485`: theirs is a strict prefix of ours — the only
line theirs has that ours lacks is its older `updated_at` (2026-09-01T00:21:32). Ours is
byte-identical to the xgd-working tip, so incoming's own later commits already contain
everything in this pick plus 485 more transcript lines.

### Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD; no data loss.

### Forecast
Remaining picks on this transcript up to the xgd-working tip should resolve the same way
(`--ours`, ours == tip).
