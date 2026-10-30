---
uid: report-f9d1e81d
id: REPORT-6362
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T07:24:22.755272+00:00'
updated_at: '2026-10-05T07:24:22.755272+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resolve: bug-360c5a44 / 0d64e0f0a9

Pick `0d64e0f0a9` (2026-09-01 14:52:34 -0700) is the ticket's create commit
(`xgd(ticket): create bug bug-360c5a44`). The conflict is AA because the pick's parent
carries the BUG-904 strip, so there is no base blob. That missing base is an artifact.

- Stage blobs: ours `0f983095aa` (== `HEAD:<path>`), theirs `58cd6a31b2`.
- Theirs is the creation stub: `title: Untitled`, `status: draft`, `completed_at: null`,
  `last_field_updated: created_at`, body `(new ticket)`. `git diff :3: :2: | grep '^-'`
  shows only those stub values. Ours rewrites every one of them, so ours is a strict superset.
- `git diff :2: xgd-working:<path>` (tip blob `fca35b86a8`) is one line, `updated_at`
  (09-19T15:15:41.714382 vs ours' 15:15:28.543268, 13.2 s). Incoming's own tip carries ours'
  title, body, `completed_at` and `free_and_reconciled` status.
- These are the same blobs as the earlier resolutions of this pick (REPORT-5913, REPORT-6200).

Resolution: `--ours`, zero net change from HEAD. `git status --porcelain` is empty, and
CHERRY_PICK_HEAD is intact at `0d64e0f0a9`.

Forecast: later picks on this ticket before the xgd-working tip should also be `--ours`. The
tip pick wins the `updated_at` fact only, by 13.2 s.
