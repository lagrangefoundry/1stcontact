---
uid: report-ea4c1dd4
id: REPORT-4378
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:19:45.040966+00:00'
updated_at: '2026-09-19T10:19:45.040966+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — class `UU`, rule **2e** (intent/bookkeeping
  ticket: `request-*`). Resolved to the **OURS/HEAD** side.

  The two sides touch exactly the same three facts and nothing else:

  | fact | base | ours (HEAD) | theirs (incoming `22c666b6`) |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-31T21:41:19Z` | `2026-09-02T01:34:36Z` | `2026-08-31T21:51:22Z` |
  | `last_field_updated` | `status` | `result` | `status` |

  Ours additionally carries facts theirs never touched: `completed_at`,
  `result: pass`, `fields.merged_at_commit`, the collapsed `fields.commits` entry
  (`main_sha: 4b43dd9a`), and a ~215-entry `fields.orphan_commits` remap table.
  Theirs adds nothing ours lacks, so there is no disjoint content to combine —
  this is 2e's "same field changed differently on each side" case, resolved by the
  later-positioned intent, plus 2e's "one side is a strict superset" case for
  everything else.

  Timeline, per the auto-enrichment's "take the more recent commit by timestamp"
  rule (intent unknown on both sides):
  - ours — `801f03a0` `2026-09-14 03:15:51 -0700`
  - theirs — `22c666b6` `2026-08-31 14:51:23 -0700`

  Ours is later on both axes (commit date and ticket `updated_at`), and is also
  later on the lifecycle axis: `free_and_reconciled` is downstream of
  `ready_to_reconcile`. Taking theirs would have regressed an already-reconciled,
  already-merged ticket back to a pre-reconcile state and discarded `result: pass`,
  `completed_at`, `merged_at_commit` and the whole orphan-commit remap table.

  Mechanics: `git checkout --ours -- <path>` then `git add --sparse -- <path>`
  (`.xgd/tickets/` is outside the sparse-checkout cone, so the plain `git add`
  refused the path). The worktree file was verified byte-exact against the stage-2
  blob before staging: `git hash-object` → `e909dcbb97209588efd021442f7dcabf0e18405c`,
  matching stage 2 from `git ls-files -u`.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket, not a code file, so STEP 3's code-diff guard has no code target.

The incoming commit's only change to this file is the lifecycle transition
`free_coded` → `ready_to_reconcile`. That intent is **present in HEAD via a later
route, not discarded**: HEAD has already passed through `ready_to_reconcile` and
advanced to `free_and_reconciled` with `result: pass` and
`merged_at_commit: 4b43dd9a5c0fd50ed053a33ed3defcb63f7ed8cd`. This is the
"redundant commit" shape described in STEP 4 (BUG-1109/BUG-1122), not the
"discarded" shape in STEP 3.

No hunks were dropped under the BUG-1301 precedence exception; no test files were
involved.

## Staging state

`git status --porcelain` is empty and `git diff --cached --stat HEAD` is empty —
the resolution nets to no diff vs HEAD, which is expected for a ticket whose
post-watermark state already landed. Per STEP 4 this is **not** a failure and
`--skip` was **not** called: `CHERRY_PICK_HEAD` is still
`22c666b6fb0e6e93dafb40b4872d3c5c7332a382`, left intact for
`cherry_pick_finalize_resolution` to detect the empty pick and skip the commit.

## Flagged for post-merge review

Per the auto-enrichment's resolution rule ("flag this file for post-merge review"),
`request-13a5e206` (REQ-162) was resolved on a timestamp basis with intent unknown
on both sides. Nothing about the resolution looks ambiguous — theirs is a strict
lifecycle predecessor of ours — but the flag is recorded here as instructed.
