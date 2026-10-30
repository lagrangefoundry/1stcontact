---
uid: report-1864c94b
id: REPORT-6132
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:21:12.838985+00:00'
updated_at: '2026-10-04T23:21:12.838985+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — comment-cb7fa49c / 560dcf4e42

- Branch: resync-10bbd54c, HEAD `beaaae517b`
- Picked commit: `560dcf4e42` (2026-08-31 15:57:29 -0700, "xgd(ticket): update comment comment-cb7fa49c")
- Conflicted path: `.xgd/tickets/hot/comment-cb7fa49c.md` (UU)

### Evidence
- base `940e8afd1e` / ours `2b72b3d728` / theirs `5564cf37a6`
- ours == `HEAD:<path>` == `xgd-working:<path>` (incoming's own tip)
- `git diff --numstat :2: :3:` = `1 195`: theirs' only unique line is an older
  `updated_at` (2026-08-31T22:57:29); theirs is a strict prefix of ours.
  The pick appends a turn that ours already contains (plus ~195 later lines).

### Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD
(`git status --porcelain` empty); CHERRY_PICK_HEAD intact. No content lost:
ours is incoming's own final state of this transcript.
