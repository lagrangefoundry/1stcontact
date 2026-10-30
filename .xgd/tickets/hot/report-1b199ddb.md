---
uid: report-1b199ddb
id: REPORT-5970
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:46:34.352177+00:00'
updated_at: '2026-10-04T21:46:34.352177+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: request-22aa8ea3 / d1147fdc1d

Pick: `d1147fdc1d` (author 2026-08-23 13:36:57 -0700, "xgd(ticket): update request request-22aa8ea3").
HEAD: `d5678200bb`. Apply target / publish tip: `397daf02997f5670ac4ce7c26f12ed9050b0f66d`.
Conflict: `AA` on `.xgd/tickets/hot/request-22aa8ea3.md`.

## Diagnosis

AA is the BUG-904 strip artifact: the pick's parent is `0d11a0146e` (strip of
`.xgd/tickets`), so there is no merge base. Shared ancestor is `f22139f644` (07-01).

This is the already-replayed shape:

- HEAD's history: `f22139f644` → `03efd75cd4` (08-20 14:38:34) → `4f9f9e2459`
  (08-23 13:36:57, same subject and author date as the pick).
- `:2:` (ours, `4cf2d20619`) == `HEAD:<path>` == `4f9f9e2459:<path>`. HEAD already
  holds a replay of this pick.
- `:3:` (theirs, `06789d6222`) == `xgd-working:<path>`; the pick is incoming's tip for
  this path.
- `git diff :3: :2:` is a single hunk: ours adds the EOF newline. No frontmatter or
  body content differs.

So incoming has nothing that HEAD lacks; the only delta is EOF-newline serialization.

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD
(`git status --porcelain` empty), CHERRY_PICK_HEAD intact, HEAD unmoved.

## Forecast

`d1147fdc1d` is the last xgd-working commit touching this path, so no further picks
on request-22aa8ea3 are expected.
