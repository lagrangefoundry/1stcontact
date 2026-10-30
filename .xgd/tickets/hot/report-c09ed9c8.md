---
uid: report-c09ed9c8
id: REPORT-6344
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:03:15.364932+00:00'
updated_at: '2026-10-05T04:03:15.364932+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync resolve conflicts — bug-034bf955 (BUG-42) / 24b0c044bc

Pick: `24b0c044bc` (2026-09-01 14:10:09 -0700, "xgd(ticket): update bug bug-034bf955"), HEAD `7ef32ed2d6`.

Conflicted path: `.xgd/tickets/hot/bug-034bf955.md` (UU, ticket path).

Blobs: base `79bb5d0952` (draft stub, "Untitled") / ours `89395722bc` (== `HEAD:<path>`) / theirs `a47ef0550e`.

### What theirs does
draft → free_coding: sets the real title, adds `severity: medium`, and writes the full body (Symptom / Root cause / Fix / Test plan).

### Why ours wins
- `git diff :3: :2:`: ours carries theirs' title, `severity` and body **verbatim**. The only body delta is ours' trailing newline at EOF. Ours is ahead on every lifecycle fact: `updated_at` 09-19 vs 09-01, `completed_at` 09-14 vs null, `status` `free_and_reconciled` vs `free_coding`. Ours also adds `commits`, `version 0.2.36`, `story_points 3` and `bundled_in: bundle-8e1807f6`, all of which came later on xgd-working.
- `git diff :2: xgd-working:<path>` (tip `49266c45a3`) is a single `updated_at` line (09-19T15:15:48.59 vs ours' 15:15:29.76, 18.8 s). Incoming's own latest state agrees with ours on everything else.

Resolution: `git checkout --ours` + `git add --sparse`. Zero net change from HEAD (`git status --porcelain` empty), CHERRY_PICK_HEAD intact.

### Forecast
The later bug-034bf955 picks on this branch should resolve `--ours` the same way, because ours is a superset of the pick's content. The exception is the tip `49266c45a3` (09-19), which wins `updated_at` alone by 18.8 s.
