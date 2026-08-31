---
uid: report-1dcc93ef
id: REPORT-3062
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:40:31.652578+00:00'
updated_at: '2026-08-31T20:40:31.652578+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket
  (`request-*`) → **rule 2e**, per-fact resolution, resolved toward HEAD.
  Staged with `git add --sparse` (path is outside the sparse-checkout cone,
  DOC-986 §2/§4.1).

  Single conflict hunk, exactly two facts, both touched by both sides:

  | fact | base | HEAD (ours) | incoming (theirs) |
  |---|---|---|---|
  | `status` | `free_coded` | `bundled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-23T22:13:13` | `2026-08-24T02:10:41` | `2026-08-24T01:11:09` |

  HEAD additionally adds `fields.bundled_in: bundle-b3b7c399`,
  `fields.chat_comment: comment-98e86f10`, `version: 0.2.9` and five further
  `commits[]` entries — none of which the incoming side touches.

  Same field changed differently on each side, so 2e's per-fact timeline rule
  applies. HEAD is later on every measure:
  - ticket `updated_at` 02:10:41 > 01:11:09;
  - HEAD-side commit `b6ac2faa` (`seed_local_overlay`, 2026-08-30 22:06:21) is
    seven days after the incoming commit `67b8efdd` (2026-08-23 18:11:09);
  - `bundled` is downstream of `ready_to_reconcile` on the same lifecycle
    (`free_coded` → `ready_to_reconcile` → `bundled`), and HEAD carries the
    `bundled_in` field that state implies.

  HEAD is therefore a strict per-fact superset: every fact the incoming side
  advanced, HEAD advanced further along the same axis. Resolution is
  `git checkout --ours`; staged blob is `6546223f`, byte-identical to stage 2.
  No content was invented, and no `intent_uid`/`story_uid`/`capability_uid`
  field was touched.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket.

The incoming commit's only change is advancing `request-554ac441` off
`free_coded`. That change **is present in HEAD**, via a later route: the
`seed_local_overlay` commit already carried the ticket past
`ready_to_reconcile` to `bundled`, along with the whole downstream state
(`bundled_in`, `chat_comment`, `version: 0.2.9`, six `commits[]` entries).
Nothing the developer authored is discarded — the incoming state is an earlier
point on the same progression HEAD has already passed.

No hunks were dropped under the BUG-1301 precedence exception; it did not
arise here.

## Note for the finalize step

The resolution nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty):
this cherry-pick is redundant, its effect already landed through the
post-watermark overlay seed. Per STEP 4 this is not a failure and `--skip` was
not called — the tree is staged and `CHERRY_PICK_HEAD` (`67b8efdd`) is left
intact for `cherry_pick_finalize_resolution` to handle.

This is the STEP 3 "present via a different route" case, not the "genuinely
absent" case: HEAD demonstrably contains the incoming intent and more.
