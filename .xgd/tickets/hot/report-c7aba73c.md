---
uid: report-c7aba73c
id: REPORT-6291
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:31:10.808186+00:00'
updated_at: '2026-10-05T03:31:10.808186+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resolution: `.xgd/tickets/hot/bug-3ade1af4.md` (BUG-40), pick `0170f868e2`

Picked commit: `0170f868e2` (2026-09-01 12:02:29 -0700, `xgd(ticket): update bug bug-3ade1af4`)
HEAD: `1543af3c11`

Index blobs:
- base `:1:` `a92ed3206a` (theirs blob of the previous pick, create commit `3fc6491817`)
- ours `:2:` `4b1ec9bd2a` (== `HEAD:<path>`)
- theirs `:3:` `c0df113819`

### Analysis
- base → theirs adds exactly one line: `chat_comment: comment-94979ef7`.
- Ours already carries that line verbatim, plus the full later state: title, body,
  severity, story_points, commits, version 0.2.33, `bundled_in: bundle-8e1807f6`,
  `status: free_and_reconciled`, `completed_at`. Ours is a strict superset of theirs.
- ours vs the xgd-working tip (`3f23e96b90`) differs in only one line, `updated_at`
  (tip 15:15:46.30 vs ours 15:15:31.62). That fact belongs to the tip pick, not to this one.

### Resolution
`git checkout --ours` followed by `git add --sparse`. No net change from HEAD,
`git status --porcelain` is empty, and CHERRY_PICK_HEAD is still in place.
Nothing from incoming is lost.

### Forecast
Later picks on bug-3ade1af4 up to the 09-19 tip should also resolve `--ours`.
The tip (`updated_at` 09-19 15:15:46.300383) is the exception: it wins `updated_at`.
