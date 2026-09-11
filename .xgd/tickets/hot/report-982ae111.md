---
uid: report-982ae111
id: REPORT-4079
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:50:30.814560+00:00'
updated_at: '2026-09-11T22:50:30.814560+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **UU**, class **2e** (intent/bookkeeping
  ticket: `request-*`). Resolved per-fact, not whole-file.

  The incoming commit `6788b08404` (2026-08-24, "Data fix (BUG-1265): merge
  orphaned working_sha 7ebc721b ... into the surviving entry's
  working_sha_history") touches two facts. Only one of them conflicted:

  | fact | HEAD | incoming | kept |
  |---|---|---|---|
  | `fields.commits` | already fixed | the fix | — (applied clean, no conflict) |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | **HEAD** |
  | `completed_at` | `2026-08-31T14:22:42` | `null` | **HEAD** |
  | `updated_at` | `2026-08-31T14:22:42` | `2026-08-24T01:14:03` | **HEAD** |
  | `last_field_updated` | `status` | `commits` | **HEAD** |

  The `commits` hunk — the actual payload of the incoming commit — merged
  cleanly and is present at line 47 of the resolved file. The conflict was
  confined to the lifecycle block, where the two sides changed the same fields
  differently. Per 2e's timeline rule the later-positioned side wins that fact:
  HEAD's block is 7 days newer (2026-08-31 vs 2026-08-24) and records a
  lifecycle advance the incoming commit never intended to make — `6788b08404`'s
  own message says "no code change" and its `last_field_updated: commits`
  declares `commits` as its subject. Its status block is stale carry-along from
  the whole-frontmatter rewrite, not intent. Taking it would have silently
  reverted REQ-143 from `free_and_reconciled` back to `ready_to_reconcile` and
  cleared `completed_at`.

  No fields invented; `intent_uid` / `story_uid` / `capability_uid` untouched.

## Incoming changes preserved

Yes — verified per STEP 3, and this is the redundant case, not the discarded one.

`git show 6788b08404 -- .xgd/tickets/hot/request-18a48d63.md` has exactly one
substantive hunk: insert `7ebc721b83ab6202fdec600cd0493b69964bac39` into the
surviving entry's `working_sha_history`, and delete the orphaned
`working_sha: 7ebc721b...` entry. Both halves are present in `HEAD`:

    $ git show HEAD:.xgd/tickets/hot/request-18a48d63.md
    34:  commits:
    35:  - working_sha: 96118c32cfc8495b6f7f2eff7046b518e267d84c
    38:    working_sha_history:
    39:    - b71a8641182d62dd46b5fa6d0cf78a582cff4eb7
    40:    - 7ebc721b83ab6202fdec600cd0493b69964bac39   <-- inserted
    41:    - 761b7fbd0efa55515fdea9a8ddc5f9a38be91c4d
    42:  version: 0.1.54                                <-- orphan entry gone

The route by which it reached HEAD is identified: commit `209bea117b`
(`xgd(ticket): seed_local_overlay request request-18a48d63`, 2026-08-30) applies
the byte-identical change — same insertion, same orphan removal — ahead of this
cherry-pick's replay. A post-watermark sync landed the BUG-1265 data fix before
the pick got to it.

Consequently the staged resolution nets to no diff vs HEAD
(`git diff --cached HEAD` is empty). Per STEP 4 that is not a failure and I did
not call `--skip`: STEP 3's test distinguishes redundant from discarded, and the
incoming commit's key changes are *present* in HEAD rather than absent, so this
is redundant. Staged and exiting normally for
`cherry_pick_finalize_resolution` to detect the clean staged diff.

No hunks were dropped under the BUG-1301 precedence exception; no test files
were involved in this conflict.

## Sequencer state

`CHERRY_PICK_HEAD` (`6788b08404d93eafcf2e329be79f1152162cd779`) is intact. Only
`git add --sparse` was issued — no `--continue` / `--skip` / `--quit` /
`--abort`, no `reset`, no `checkout <branch>`.
