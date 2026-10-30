---
uid: report-731147ad
id: REPORT-6035
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:23:36.335719+00:00'
updated_at: '2026-10-04T22:23:36.335719+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — bundle-8eef3846 / c2efcb99cb

**Pick:** `c2efcb99cb` (2026-08-30 22:05:09 -0700) `xgd(ticket): create bundle bundle-8eef3846`
**Conflict:** `.xgd/tickets/hot/bundle-8eef3846.md`, AA (both added). The base is missing because of the BUG-904 ticket-tree strip.
**Resolution:** `--ours` (zero net change from HEAD)

## Evidence (create-commit shape)
- `:3:` `8c9e2640cb` is the creation-time draft (`ready_to_reconcile`, two `working_sha` entries, short body).
- `:2:` `fb4a6e5694` == `HEAD:<path>`. HEAD's history starts at `seed_local_overlay` `42cb3bab68` (08-31 12:21) and ends at `2ca3de8c49` (08-31 17:00:08): `free_and_reconciled`, `completed_at`, `main_sha 90527353c0`, `orphan_commits`, `result: pass` and the full body.
- `git diff :3: :2: | grep '^-'` shows only the draft lifecycle values (`updated_at`, `completed_at`, `last_field_updated`, `status`) and the draft `working_sha` entries, which ours folds into `main_sha`. It also shows "Done, three UATs", but that is a diff-alignment artifact: ours still has that line at line 693. Ours is a strict superset of the pick.
- xgd-working ledger: `c2efcb99cb` (create) → `232a68212a` (08-31 12:21) → tip `8da3c09f4e` (08-31 16:59:50). The tip is 18 s OLDER than HEAD's `2ca3de8c49`, and it lacks HEAD's `main_sha`/`orphan_commits`/`result` facts. Ours leads.

## Forecast
The remaining picks on this path (`232a68212a`, tip `8da3c09f4e`) should also resolve `--ours`. Ours' latest commit postdates the tip, but run the ours-vs-tip diff live before deciding the tip pick.
