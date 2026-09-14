---
uid: report-e6234a23
id: REPORT-4188
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:35:03.792135+00:00'
updated_at: '2026-09-14T00:35:03.792135+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, index-only (sparse-excluded on the
  reconcile branch, so no working-tree markers). Class 2e (intent/bookkeeping
  ticket). Rule applied: per-fact comparison; the only fact genuinely contested
  is `status`, where HEAD holds a strictly downstream lifecycle value, and HEAD
  is the later side on every other differing fact. Resolution is HEAD's blob
  (`git checkout --ours` + `git add --sparse`). Ours stage blob (963294b5) is
  identical to HEAD, so taking ours discarded no auto-merged content.

Incoming commit is d22ba37c `xgd(ticket): update bug bug-3ade1af4`, fourth in
the chain resolved this session (after 08bbde06, d975830c, cb4ece92). Base has
advanced to 50c13659 (cb4ece92's blob).

Per-fact breakdown (base 50c13659 -> ours 963294b5 / theirs 75787399):

| fact | base | theirs (incoming d22ba37c) | ours (HEAD) | resolution |
|---|---|---|---|---|
| `status` | `free_coded` | `ready_to_reconcile` | `bundled` | same field, both advanced; ours is strictly downstream on the same forward path -> ours |
| `last_field_updated` | `title` | `status` | `status` | both sides agree |
| `updated_at` | 09-01 19:30:16Z | 09-01 19:34:04Z | 09-11 18:53:54Z | later wins -> ours |
| `title` | "27 failures + 30 collection errors..." | unchanged | unchanged | identical on all three |
| `fields.bundled_in` | absent | absent | `bundle-8e1807f6` | ours-only addition -> kept |

Basis for "strictly downstream" on `status`, checked rather than assumed:
`xgd_source/system_docs/FREE-CODING.md:1065` documents the forward sequence
`ready_to_reconcile -> reconciling -> ...`, and
`xgd_source/core/ticketing/foreign_goal.py:102` groups
`free_coded`/`ready_to_reconcile`/`bundled`/`reconciling` as machine-side
statuses on that same path. Corroborating evidence: HEAD's `bundled_in` names
`bundle-8e1807f6` - the very bundle this reconcile run is processing - so HEAD's
`bundled` is the state produced by consuming the incoming
`ready_to_reconcile`, not a competing branch of the state machine.

No content was invented; every value in the result is present on at least one
side.

## Incoming changes preserved

Commit d22ba37c's entire diff is three lines: `updated_at`,
`last_field_updated: title -> status`, and `status: free_coded ->
ready_to_reconcile`. Its substantive intent - advancing the ticket out of
`free_coded` - is realised in HEAD, which has advanced one rung further to
`bundled`. `last_field_updated: status` matches exactly. Only the `updated_at`
timestamp is not carried, superseded by a strictly later edit already in HEAD.
Nothing from the incoming diff is absent; the ticket's lifecycle position is
ahead of, not behind, what the incoming commit asked for. Redundant commit, not
a discard (STEP 3 / BUG-1109 distinction).

Consequence: the staged diff vs HEAD is empty. Per STEP 4 this is not a failure
and `--skip` was NOT called; the finalize step will detect the clean staged
diff and skip the commit.

No code/implementation files, no UAT test files, and no spec tickets were
involved. No hunks were dropped under the BUG-1301 precedence exception.
