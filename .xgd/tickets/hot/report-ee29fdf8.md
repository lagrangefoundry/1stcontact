---
uid: report-ee29fdf8
id: REPORT-4850
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:44:22.634303+00:00'
updated_at: '2026-09-23T18:44:22.634303+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), so STEP 2e applies. Path is outside this worktree's
  sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only in the
  index with no working-tree markers: materialized stage 2 (`284e1e08`) to the
  path and staged it with `git add --sparse`.

  Per-fact composition of the two sides:

  | fact | base | theirs (`fc7b846d`) | ours (HEAD) | resolved |
  |---|---|---|---|---|
  | `status` | `free_coded` | `ready_to_reconcile` | `free_and_reconciled` | ours |
  | `updated_at` | 09-01T21:34 | 09-01T21:43 | **09-19T15:15** | ours |
  | `completed_at` | `null` | `null` (untouched) | `2026-09-14T10:29` | ours |
  | `bundled_in` | — | — (untouched) | `bundle-8e1807f6` | ours |
  | trailing newline | absent | absent (untouched) | present | ours |

  Theirs contributes **no field that ours lacks**, so there is nothing to
  combine — ours is a strict superset. The only contested facts are `status`
  and `updated_at`, and the two sides are not competing intents on different
  aspects of the ticket: they are the *same* lifecycle fact at two points along
  **one** ledger chain. Verified by replaying both ledgers:

  - incoming (`xgd ticket history request-8b33a146 --rev fc7b846d79`):
    `draft → free_coding → free_coded → ready_to_reconcile`, all 2026-09-01.
  - HEAD (`xgd ticket history request-8b33a146`): continues that chain —
    `… → bundled → free_and_reconciled`, 2026-09-19.

  So HEAD holds the strictly later position on both contested facts, and
  2e's "take the LATER-positioned intent, per fact" resolves both to ours.
  Nothing was discarded that ours does not already subsume.

## Incoming changes preserved

`.xgd/tickets/hot/request-8b33a146.md` is a ticket, not a code/implementation
file, so STEP 3's code-file preservation check does not apply to it — and no
code files were in conflict.

Stated plainly for the record: the incoming hunk's literal bytes
(`status: ready_to_reconcile`, `updated_at: 2026-09-01T21:43:09`) do **not**
appear in the resolved version, and that is the intended outcome of 2e rather
than a discarded developer change. `ready_to_reconcile` is an intermediate
state that HEAD's ledger already transited and advanced past — HEAD went on to
`bundled` and then `free_and_reconciled`, recording `completed_at` and
`bundled_in` along the way. Writing theirs would regress `status` two steps and
blank `completed_at`. The *effect* the incoming commit intended (move this
ticket out of `free_coded` and onward toward reconciliation) is fully present
in the resolved file, at a later point than the incoming commit could see.

This is 2e's per-fact timeline rule, not the BUG-1301 PRECEDENCE exception —
no refactor removed anything, and no test function was deleted.

## Staging state

`git status --porcelain` shows no conflict-class lines (UU/AA/DU/UD/AU/UA);
only nine untracked `.xgd/tickets/cold/*.md` files, which predate this step.
`git diff --cached HEAD` is empty: the resolution is byte-identical to HEAD, so
this cherry-pick carries no net change and finalize will skip the commit.
`CHERRY_PICK_HEAD` is intact — no `--continue`/`--skip`/`--quit`/`--abort` was
issued.
