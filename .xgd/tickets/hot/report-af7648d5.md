---
uid: report-af7648d5
id: REPORT-6211
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:49:30.222152+00:00'
updated_at: '2026-10-05T02:49:30.222152+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resolution: comment-48c75d2e / f280907eae (2026-08-31 18:05:39)

- Conflict: UU `.xgd/tickets/hot/comment-48c75d2e.md` (append-only chat transcript).
- Blobs: base `fa6bb78afd`, ours `6837b32b26`, theirs `d49d6501be`.
- `git diff --numstat :2: :3:` = `1 210`. The only line theirs has that ours lacks is its older
  `updated_at` (2026-09-01T01:05:39). So theirs is a strict prefix of ours.
- ours == HEAD:<path> == xgd-working:<path> (`6837b32b26`). Ours is incoming's own tip state.
- Outcome: `git checkout --ours` + `git add --sparse`. Zero net change from HEAD, no transcript lines lost.
- Forecast: the remaining picks on this transcript through the tip `677a0d4b97` should also be `--ours`.
