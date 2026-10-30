---
uid: report-005a2efc
id: REPORT-6109
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:08:01.154837+00:00'
updated_at: '2026-10-04T23:08:01.154837+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution: request-119dd4af (REQ-159) / ad68bd8ac7

- Picked commit: `ad68bd8ac7` (2026-08-31 15:17:07 -0700), `free_coding` → `free_coded`, adds
  `fields.commits` (working_sha `115f0d39ec`) and `fields.version: 0.2.23`.
- Conflicted path: `.xgd/tickets/hot/request-119dd4af.md` (ticket path, frontmatter only).
- Blobs: base `84206ff09a` (the previous pick's theirs, `db39fce0f8`), ours `97468957db` (== HEAD), theirs `7aa29ba4c3`.

## Decision: ours (zero net change)

- Ours is byte-identical to xgd-working's own later commit `294d87111c` (2026-09-09 14:32:49, the re-bundle into
  `bundle-87be4669`). `git diff 97468957db 294d87111c:<path>` is empty.
- Ours already has theirs' `commits` entry and `version: 0.2.23` byte-for-byte. Ours' `status: bundled` and
  `updated_at` 09-09 come from that later lifecycle step, so nothing from this pick is lost.
- `git checkout --ours` + `git add --sparse`; `git status --porcelain` is empty, HEAD `da7b4fb42f` has not moved,
  and CHERRY_PICK_HEAD is still in place.

## Forecast for the remaining REQ-159 picks

`3013025820`, `1d262a55d6`, `f3c81c5df5`, `ed7b3cc779`, `a077c28171`, `c09f4e8438`, `294d87111c` → `--ours`
(ours == `294d87111c`). The tip `b354b050e7` (09-11) is NOT `--ours`: run the ours-vs-tip diff.
