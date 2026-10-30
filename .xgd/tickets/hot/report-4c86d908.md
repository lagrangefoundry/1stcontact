---
uid: report-4c86d908
id: REPORT-6173
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:28:26.609022+00:00'
updated_at: '2026-10-05T02:28:26.609022+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

- Pick: `1195a7b589` (xgd-working, 08-31 / updated_at 2026-09-01T00:11, "open questions resolved" body edit on request-439cd0c8, REQ-163)
- Path: `.xgd/tickets/hot/request-439cd0c8.md` (UU, one marked region: `updated_at`/`last_field_updated`/`status`)

## Evidence

- `git diff :3: :2:` touches only frontmatter: theirs `free_coded` / `last_field_updated: body` / 09-01 vs ours `bundled` / `status` / 09-09 + `bundled_in: bundle-87be4669`, plus one stray blank line on theirs. The body, including the "Resolved after implementation" section this pick adds, is byte-identical in ours.
- `git diff --stat :2: 1d1ccd1858:<path>` is EMPTY. Ours is byte-identical to xgd-working's own 09-09 re-bundle, a later commit than this pick, so incoming itself supersedes theirs' frontmatter.

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD, and nothing from the pick is lost.

## Forecast

Remaining REQ-163 picks before the tip (`e1541ec5c2`, `0e90542c74`, then the 09-09 trio `cb62e7176f`/`57b1a5e352`/`1d1ccd1858`) should all go `--ours`. The tip `f406eb1960` (09-11) is NOT `--ours`; run the ours-vs-tip diff.
