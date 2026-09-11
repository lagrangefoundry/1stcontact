---
uid: report-633edb68
id: REPORT-4091
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:10:36.833002+00:00'
updated_at: '2026-09-11T23:10:36.833002+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — class **UU**, rule **2e** (intent/bookkeeping
  ticket; `request-*`, user-authored lifecycle state, not matrix state). Path is outside
  the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only in the index —
  no working-tree markers, no materialised file.

  Incoming commit: `e611edb` "xgd(ticket): update request request-554ac441"
  (author 2026-08-23 19:10 -0700, free_coded from xgd-working).

  Three-way stage comparison:

  | side | blob | `status` | `completed_at` | `fields` |
  |---|---|---|---|---|
  | base (1) | `5ac40b4` | `ready_to_reconcile` | `null` | version 0.2.9 |
  | ours (2) | `85e97c8` | `free_and_reconciled` | `2026-08-31T14:22:34Z` | + `bundled_in: bundle-b3b7c399`, + `chat_comment: comment-98e86f10` |
  | theirs (3) | `b85c50d` | `bundled` | `null` | + `bundled_in: bundle-b3b7c399` |

  Per-fact resolution, not whole-file:
  - `fields.bundled_in` — both sides set the **same** value (`bundle-b3b7c399`). Not a
    competing fact; present in the result either way.
  - `status` / `completed_at` — same fact, different values. Ours is the strictly later
    lifecycle position (`bundled` → … → `free_and_reconciled`); the incoming side is the
    older bookkeeping state this ticket has already moved past.
  - `fields.chat_comment` — present only on ours; incoming never touched it. Kept.
  - trailing newline at EOF — added by ours. Kept.

  Result: ours is a strict superset of incoming on every fact, so 2e's superset clause
  governs and the resolution is ours wholesale. Staged with
  `git update-index --cacheinfo 100644,85e97c8…,<path>` (clears all three conflict stages
  without needing the file materialised), then `git update-index --skip-worktree` to
  restore the `S` bit its sibling ticket files carry — otherwise the out-of-cone path
  reports as a spurious worktree deletion.

### Note on the auto-enrichment's timestamp rule

The enrichment block said "intent unknown on one or both sides — take the more recent
commit by timestamp." Taken naively that points the wrong way, and it is worth recording
why the resolution goes the other direction:

- ours-side last-touching commit `ee933be` has **author** date 2026-08-22, *older* than
  incoming's 2026-08-23;
- but its **commit** date is 2026-09-11 (replayed onto this branch today) and its entire
  diff is a single added trailing newline;
- the substantive ours-side facts come from `5e6f3a68` (author 2026-08-31), which is
  later than incoming.

So the author date on the tip is a replay-ordering artefact, not content recency. Applied
per-fact against the commit that actually authored each fact, the timestamp rule and 2e's
superset rule agree: keep ours. Flagging for post-merge review as the enrichment asks,
though the facts are not in genuine competition.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path is a
bookkeeping ticket.

STEP 3 check on the incoming commit's key changes, against `HEAD:.xgd/tickets/hot/request-554ac441.md`:

- `fields.bundled_in: bundle-b3b7c399` — **present** at line 44 of HEAD's blob.
- `status: bundled` — superseded in HEAD by `status: free_and_reconciled` (line 11) with
  `completed_at: 2026-08-31T14:22:34Z` (line 9). The incoming transition's effect reached
  HEAD through the later `5e6f3a68`, which carried the ticket past `bundled`; it is
  present via a different route, not discarded.

This is therefore the redundant case described in STEP 4, not the discarded case in
STEP 3: `git diff --cached HEAD` is empty and `git ls-files -u` is empty. Staged and
exiting normally — no `--skip`, `--continue`, `--quit`, or `--abort` was issued, and
`CHERRY_PICK_HEAD` (`e611edba0bae2d5fd457263717557d26e2ed4a73`) remains in place for
`cherry_pick_finalize_resolution`.

No hunk was dropped under the BUG-1301 precedence exception. No test function was deleted.
