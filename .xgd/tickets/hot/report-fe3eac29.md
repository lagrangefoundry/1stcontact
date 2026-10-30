---
uid: report-fe3eac29
id: REPORT-6138
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:24:18.378672+00:00'
updated_at: '2026-10-04T23:24:18.378672+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — comment-cb7fa49c / 0f9cf0c91d

- Pick: `0f9cf0c91d` (2026-08-31 16:03:39 -0700, "xgd(ticket): update comment comment-cb7fa49c")
- HEAD: `beaaae517b`
- Conflict: `UU .xgd/tickets/hot/comment-cb7fa49c.md`

## Evidence
- base `:1:` 5564cf37a6, ours `:2:` 2b72b3d728, theirs `:3:` 8da87177ba
- `git rev-parse xgd-working:<path>` = `2b72b3d728` — **ours is byte-identical to incoming's tip**.
- `git diff --numstat :2: :3:` = `1 187` — theirs is a strict prefix of ours (append-only
  transcript; the single `+` line is theirs' older `updated_at`). Ours already contains
  every turn this pick adds plus the later ones.

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD
(`git status --porcelain` empty), CHERRY_PICK_HEAD intact. No content from incoming is
lost: incoming's own tip equals ours.

## Forecast
Further picks on comment-cb7fa49c on this resync should show the same shape (numstat
`1 N` with N shrinking, ours == xgd-working tip) → `--ours`, until incoming reaches the tip.
