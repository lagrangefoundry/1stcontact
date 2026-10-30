---
uid: report-583aba88
id: REPORT-6170
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:27:11.833785+00:00'
updated_at: '2026-10-05T02:27:11.833785+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: comment-0386ff02 / 6867978324

- Branch: resync-10bbd54c, HEAD `061891990f`
- Pick: `6867978324` (2026-08-31 17:09:34 -0700) xgd(ticket): update comment comment-0386ff02
- Conflicted path: `.xgd/tickets/hot/comment-0386ff02.md` (UU)

## Evidence
- base `:1:` `e721bd764e`, ours `:2:` `424971ebda`, theirs `:3:` `a4d63c7089`
- ours == `HEAD:<path>` == `xgd-working:<path>` (`424971ebda`): HEAD already holds incoming's tip transcript.
- `git diff --numstat :2: :3:` = `1 508`: theirs is a strict prefix of ours (the one `+` line is theirs' older `updated_at`).

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD; no transcript turns lost.
Same inverse-prefix shape as the earlier comment-0386ff02 picks on this branch (REPORT-6083 … REPORT-6143).
Forecast: remaining picks on this transcript up to the xgd-working tip resolve `--ours` the same way.
