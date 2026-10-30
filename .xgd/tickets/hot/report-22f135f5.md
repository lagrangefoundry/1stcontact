---
uid: report-22f135f5
id: REPORT-5958
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:37:41.092708+00:00'
updated_at: '2026-10-04T21:37:41.092708+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resolution: `.xgd/tickets/hot/request-0cdfdc5b.md`. Ours wins, with zero net change.

Pick `458b7fc9c2` (2026-08-23 12:48:08 -0700, "xgd(ticket): update request request-0cdfdc5b") conflicted as **AA**. Its parent chain runs through `0d11a0146e`, the BUG-904 strip commit that deletes the ticket tree. Because of that strip, the conflict has no base stage. The missing base is an artifact of the strip, and neither side actually diverged there.

- The shared ancestor is `99aca98528` (08-19), blob `14deeb8a9d`.
- Theirs (`:3:` `4c2e2307bd`) changes three things relative to the ancestor:
  - It rewrites the 4 `working_sha` values and appends the old shas to each `working_sha_history`.
  - It adds `chat_comment: comment-419ac5a2`.
- Ours (`:2:` `505e6129ef`, == `HEAD:<path>`) moved past the ancestor through `d3779a3638`, `434f316f19` and `9981276295` (08-31).
- `git diff :3: :2:` touches only these lines: `updated_at` (ours 08-31 vs theirs 08-20), `completed_at`, `status` (`free_and_reconciled` vs `ready_to_reconcile`), and ours' extra `bundled_in: bundle-b3b7c399`. All of the pick's own changes (the working_sha rewrite, the history append and `chat_comment`) are already in ours, byte for byte.
- `git diff :2: xgd-working:<path>` is **empty**. Ours is the incoming branch's own tip state (`8e0e344d4b`, 08-31 07:22:38).

Steps taken: `git checkout --ours` followed by `git add --sparse`. Afterwards `git status --porcelain` is empty, CHERRY_PICK_HEAD is intact, and HEAD is still `d5678200bb`.
