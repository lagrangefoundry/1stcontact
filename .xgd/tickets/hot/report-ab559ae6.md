---
uid: report-ab559ae6
id: REPORT-3072
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:00:42.695488+00:00'
updated_at: '2026-08-31T21:00:42.695488+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — UU, intent/bookkeeping ticket (STEP 2 rule **2e**, "one side is a strict superset").
  Incoming commit `e611edba0b` (`xgd(ticket): update request request-554ac441`) changed exactly three facts:
  `updated_at` → `2026-08-24T02:10:41.591464+00:00`, `status` → `bundled`, and added `fields.bundled_in: bundle-b3b7c399`.
  The HEAD side (`seed_local_overlay request request-554ac441`) made the identical three changes **plus** added
  `fields.chat_comment: comment-98e86f10`. The only textually conflicting region was the single added
  `chat_comment` line adjacent to `bundled_in`; every other incoming fact merged cleanly.
  Resolved by keeping the superset (`git checkout --ours`), which preserves all incoming facts and the one
  extra HEAD-side field. No content invented; no field from either side dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/request-554ac441.md` — verified against `git show e611edba0b -- <file>`. All three incoming
  hunk changes are present in the resolved file: line 8 `updated_at: '2026-08-24T02:10:41.591464+00:00'`,
  line 11 `status: bundled`, line 44 `bundled_in: bundle-b3b7c399`. Nothing from the incoming diff is absent.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.

## Note on the net-zero staged diff

After staging, `git status --porcelain` reports no tracked changes: the resolution is byte-identical to HEAD.
This is the redundant case described in STEP 4, not a discard — HEAD's `seed_local_overlay` commit had already
applied the incoming commit's full effect through a different route, and additionally set `chat_comment`.
STEP 3's check distinguishes these, and it passes: the incoming commit's key changes are *present* in HEAD,
not merely missing from the resolution. Per STEP 4, no `--skip` was issued; the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `e611edba0bae2d5fd457263717557d26e2ed4a73`) is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.
