---
uid: report-51d7bbfa
id: REPORT-4579
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:41:06.118959+00:00'
updated_at: '2026-09-20T23:41:06.118959+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — class **UU**, intent/bookkeeping ticket
  (`bug-*`), outside the sparse-checkout cone (conflict existed in the index
  only, no working-tree markers). Rule **2e** applied: resolved per fact via the
  two intent ledgers (`xgd ticket history --rev`), not by picking a winning file.

  | fact | ours (HEAD `2b85aca40a`) | theirs (`66ebe3503a`) | resolution |
  |---|---|---|---|
  | `status` | `free_and_reconciled` @ 2026-08-31T19:19:36Z | `ready_to_reconcile` @ 2026-08-25T22:52:43Z | same field changed from `free_coded` on both sides → genuine conflict → later-positioned intent: ours |
  | `updated_at` | 2026-08-31T19:19:36Z | 2026-08-25T22:52:43Z | same field → later intent: ours |
  | `completed_at` | `null` → `2026-08-31T19:19:36Z` | untouched | ours-only fact → applied |
  | `fields.bundled_in` | adds `bundle-78f4e2fe` | untouched | ours-only fact → applied |
  | trailing newline | added | untouched | ours-only → applied |

  Every per-fact resolution independently landed on ours, so the composed
  result is byte-identical to the HEAD blob (`29cfe4b6b9`). Staged with
  `git checkout --ours` + `git add --sparse`. Net staged diff vs HEAD is
  empty; per the workflow spec this is left for Python's finalize step to
  skip — `--skip`/`--continue` were NOT called, and `CHERRY_PICK_HEAD`
  remains present.

## Incoming changes preserved

No code/implementation files were in conflict, so there are no incoming code
hunks to verify. The one conflicted file is a bookkeeping ticket resolved under
rule 2e's per-fact later-intent rule.

The incoming side's two changed facts (`status`, `updated_at`) are deliberately
NOT carried into the result, and this is the correct 2e outcome rather than a
discard of developer intent:

- Both facts are the *same fields* the HEAD side also changed from the same
  base value (`free_coded`), so they are a genuine per-fact conflict, not
  disjoint edits that could be composed.
- HEAD's intent is strictly later — 2026-08-31T19:19:36Z vs 2026-08-25T22:52:43Z,
  six days newer.
- Substantively, the incoming value `ready_to_reconcile` is an *upstream
  waypoint the HEAD lineage has already passed through*. HEAD's ledger shows
  `501a0595d1` (`seed_local_overlay`, 2026-08-31) landing the ticket at
  `bundled` with `bundled_in: bundle-78f4e2fe`, then `5a37f67dcd` advancing it
  to `free_and_reconciled` with `completed_at` set. Taking the incoming value
  would regress the ticket's lifecycle to a state already superseded.

The incoming side contributed no fact that survives per-fact composition. The
BUG-1301 precedence exception was not invoked; no test function was deleted.
