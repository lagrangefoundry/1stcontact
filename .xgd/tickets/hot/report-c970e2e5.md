---
uid: report-c970e2e5
id: REPORT-6348
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:06:01.769180+00:00'
updated_at: '2026-10-05T04:06:01.769180+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

Cherry-pick `488962bdea` (2026-09-01 14:16:50 -0700, "xgd(ticket): update bug bug-034bf955")
onto HEAD `7ef32ed2d6`. One path, `UU`: `.xgd/tickets/hot/bug-034bf955.md` (BUG-42).

Blobs: base `a47ef0550e` / ours `89395722bc` (== `HEAD:<path>`) / theirs `040ee98c5a`.

## Analysis

Theirs' whole delta from base: `updated_at` → 09-01T21:16:50, `status` `free_coding` → `free_coded`,
adds `fields.commits` (working_sha `bd7612f977`) and `version: 0.2.36`, and drops the EOF newline.

`git diff :3: :2:` shows ours already carries the `commits` entry, `version: 0.2.36` and the
no-EOF-newline body byte for byte. Ours differs only by being further along: `updated_at` 09-19,
`completed_at` 09-14, `status: free_and_reconciled`, plus `story_points: 3` and
`bundled_in: bundle-8e1807f6`. Ours is a strict superset of theirs.

`git diff :2: xgd-working:<path>` is a single `updated_at` line (tip 09-19T15:15:48.59 vs ours
15:15:29.76, 18.8 s). Incoming's own tip agrees with ours on every other fact, so nothing in this pick
is lost.

## Resolution

`git checkout --ours` + `git add --sparse`. This leaves zero net change from HEAD (`git status --porcelain`
is empty), so finalize should skip the commit. CHERRY_PICK_HEAD is still in place and HEAD hasn't moved.

## Forecast

Later picks on bug-034bf955 should resolve `--ours` too, except the incoming tip (09-19, blob
`49266c45a3`). The tip wins `updated_at` by 18.8 s, and every other field is byte-identical.
