---
uid: report-5abc0747
id: REPORT-6247
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:08:47.817869+00:00'
updated_at: '2026-10-05T03:08:47.817869+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — request-439cd0c8 / e1541ec5c2

**Pick:** `e1541ec5c2` (2026-08-31 20:36:07 -0700), `free_coded` → `ready_to_reconcile`. The diff is frontmatter only, plus it drops one blank line after the frontmatter.
**Conflicted path:** `.xgd/tickets/hot/request-439cd0c8.md` (UU)
**Blobs:** base `c16290fd6d` / ours `67db22b9a1` (== HEAD blob) / theirs `5806a766a8`

## Resolution: `--ours` (zero net change from HEAD)

- Ours is byte-identical to xgd-working's 09-09 re-bundle `1d1ccd1858` (`git diff --stat` is empty). That commit came later than this pick and supersedes it.
- `git diff ours xgd-working:<path>` changes only the 09-11 `free_and_reconciled` / `completed_at` flip, which is a later pick. The body is identical, so ours already lacks the blank line this pick removes.
- Theirs' `status: ready_to_reconcile` (09-01) is older than ours' `bundled` (09-09). Incoming's own later commits overwrite it, so nothing incoming is lost.

`git status --porcelain` is empty after `checkout --ours` + `add --sparse`. CHERRY_PICK_HEAD is intact and HEAD has not moved (`1543af3c11`).

## Forecast
The next pick is `0e90542c74`, then the 09-09 trio (`cb62e7176f`, `57b1a5e352`, `1d1ccd1858`). All are expected to resolve `--ours`. The tip `f406eb1960` (09-11, `free_and_reconciled`) is NOT `--ours`.
