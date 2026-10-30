---
uid: report-c8023e17
id: REPORT-6048
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:32:41.650442+00:00'
updated_at: '2026-10-04T22:32:41.650442+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: request-13a5e206 / c2c4b393c8

- Branch: resync-10bbd54c, HEAD `d5678200bb`, apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`
- Pick: `c2c4b393c8` (2026-08-31 13:32:40 -0700) `xgd(ticket): create request request-13a5e206`
- Conflict: AA `.xgd/tickets/hot/request-13a5e206.md` (pick's parent is the BUG-904 ticket-tree strip, so no base)

## Resolution: `--ours`, zero net change

This pick creates the ticket. HEAD's history starts later, at a seed overlay, so the two sides share no ancestor blob.

- `:3:` `355f639cd8` is the creation-time draft. `git diff :3: :2: | grep '^-'` shows only draft lifecycle values (`status: draft`, `completed_at: null`) and draft prose that was rewritten later (the schema/TypePack wording and "Open questions").
- `:2:` `e909dcbb97` == `HEAD:<path>`. That is the finished body with `free_and_reconciled`, a `main_sha` and an `orphan_commits` map.
- `git diff :2: xgd-working:<path>` (tip `a785e4bd9e`, blob `9355f06b96`) has 11 insertions and 522 deletions, all in the frontmatter, with no body hunks. Ours has main's reconcile record (`main_sha`, `orphan_commits`) and an `updated_at` 34 s later than the tip's. The tip still carries the pre-reconcile `working_sha` list.

Ours is therefore a strict successor of everything incoming wrote. After `git checkout --ours` + `git add --sparse`, `git status --porcelain` is empty, HEAD has not moved and CHERRY_PICK_HEAD is intact.

## Forecast

The same pick was resolved `--ours` on reconcile-BUNDLE-29 (REPORT-5843), and so were its later picks there (`00a976b04e`, `e53d8f39fd`, `6caee0c5d1`, `76cd837f38`, `1e28c676bf`, `40765e3d6b`, `d86269421c`, `22c666b6fb`, `0c7b4f9072`). The tip `a785e4bd9e` should also be `--ours`, because ours' `updated_at` (09-02T01:34:36) is later than the tip's (01:34:01) and ours adds the reconcile record. There is no tip exception.
