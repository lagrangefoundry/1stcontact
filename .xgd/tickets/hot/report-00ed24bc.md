---
uid: report-00ed24bc
id: REPORT-3212
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T05:00:50.493044+00:00'
updated_at: '2026-09-01T05:00:50.493044+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, index-only conflict (path is
  sparse-excluded on the reconcile branch; no working-tree markers existed).
  Class 2e (intent/bookkeeping ticket), resolved **per-fact**, not whole-file.

  Incoming (`bffb6b34` `xgd(ticket): update bug bug-23d1ec27`, 2026-08-26
  11:31) and ours (HEAD, via `fe03200d` `Merge branch 'free-BUG-39' into
  xgd-working`) both touched the same three frontmatter facts, and ours
  additionally added one field incoming never touched:

  | fact | base | incoming | ours | kept | why |
  |---|---|---|---|---|---|
  | `updated_at` | 2026-08-25T23:28:10 | 2026-08-26T18:31:09 | 2026-08-31T05:05:09 | **ours** | later-positioned intent |
  | `last_field_updated` | `story_points` | `status` | `status` | either | both sides identical |
  | `status` | `free_coded` | `ready_to_reconcile` | `bundled` | **ours** | later, and lifecycle-downstream of incoming's value |
  | `fields.bundled_in` | absent | absent | `bundle-8eef3846` | **ours** | ours-only addition, non-overlapping — kept |
  | trailing newline | absent | absent | present | **ours** | ours-only |

  No content was invented; no `intent_uid` / `story_uid` / `capability_uid`
  field was touched. The resolved blob is byte-identical to the ours stage
  (`52bab41fee`), verified by `git hash-object`.

  Resolution net-zeroes against HEAD (empty staged diff). Per STEP 4 this was
  staged and left for `cherry_pick_finalize_resolution` to skip — no
  `--skip`/`--continue`/`--abort` was issued, and `CHERRY_PICK_HEAD`
  (`bffb6b34`) is still present.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit touches
exactly one file, this bookkeeping ticket, and changes only three frontmatter
lines (`updated_at`, `last_field_updated`, `status`).

The incoming intent is **advance BUG-39 off `free_coded` toward reconcile**
(`status: free_coded` -> `ready_to_reconcile`). That intent is present in the
resolved file via a further-advanced state, not discarded: HEAD already carries
`status: bundled` plus `fields.bundled_in: bundle-8eef3846`, i.e. this very
reconcile bundle already consumed the ticket, which is strictly downstream of
`ready_to_reconcile` in the lifecycle. Re-applying incoming's value would have
*regressed* the bundle bookkeeping. `last_field_updated` is `status` on both
sides, so that fact is not in conflict at all.

This is STEP 4's redundant case, not STEP 3's discard case: the incoming
commit's key change is present in HEAD by a different route. No BUG-1301
precedence exception was invoked; no test function was deleted or dropped.
