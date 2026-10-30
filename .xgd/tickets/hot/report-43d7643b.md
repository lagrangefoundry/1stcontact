---
uid: report-43d7643b
id: REPORT-6329
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:56:10.793255+00:00'
updated_at: '2026-10-05T03:56:10.793255+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: bug-93851fea / d8ab3ec1b2

- Branch: resync-10bbd54c, HEAD 7ef32ed2d6, apply target 397daf02997f5670ac4ce7c26f12ed9050b0f66d
- Pick: d8ab3ec1b2 (2026-09-01, `xgd(ticket): create bug bug-93851fea`) — the ticket's create commit
- Conflict: AA on `.xgd/tickets/hot/bug-93851fea.md` (BUG-904 strip artifact, no base)

## Evidence
- `:2:` ours `f9b1247169` == `HEAD:<path>` (the 09-19 `free_and_reconciled` state).
- `:3:` theirs `fae1a2e445` is the creation stub: `git diff :3: :2: | grep '^-'` is only
  `title: Untitled`, draft `updated_at`, `completed_at: null`, `last_field_updated: created_at`,
  `status: draft`, `(new ticket)` — all superseded by later incoming commits.
- Ours vs xgd-working tip (`0807a4c6b6`) differs only in `updated_at` (tip 13.6 s later).
- Same blobs as the earlier REPORT-5891 / REPORT-6154 resolutions of this pick.

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD; `git status --porcelain` empty,
CHERRY_PICK_HEAD intact.

## Forecast
Later picks on this path are `--ours`; the xgd-working tip pick is the exception (wins `updated_at` by 13.6 s).
