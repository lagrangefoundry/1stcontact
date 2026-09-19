---
uid: report-d6b11b80
id: REPORT-4356
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T05:08:32.463719+00:00'
updated_at: '2026-09-19T05:08:32.463719+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, index-only
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1: three index
  stages, no working-tree conflict markers). Rule **2e** (intent/bookkeeping
  ticket — `request-*`, not a matrix-defining spec ticket, so 2d's
  ledger-replay does not apply). Resolved **per-fact**, not by whole-file
  timeline pick; the per-fact outcome happened to be uniformly the OURS side,
  staged via `git checkout --ours` + `git add --sparse`.

  Stages: base `ce69fd1a`, ours `57357427`, theirs `0b2fc295`.
  Incoming commit `6531a2d1` ("xgd(ticket): update request request-b88b79fe").

  Bodies are byte-identical across all three stages — `git diff base ours` and
  `git show 6531a2d1` both touch only the YAML frontmatter (plus, on the
  incoming side, the EOF newline). There is no prose conflict.

  Per-fact ledger:

  | fact | base | incoming | ours | kept | why |
  |---|---|---|---|---|---|
  | `status` | `free_coded` | `ready_to_reconcile` | `bundled` | ours | ours is the rung *downstream* of incoming's target state (see below) |
  | `fields.bundled_in` | absent | absent | `bundle-8eef3846` | ours | ours-only addition; incoming never touched this field |
  | `updated_at` | `2026-08-28T16:40:51Z` | `2026-08-30T20:37:44Z` | `2026-08-31T05:05:09Z` | ours | later by ~8.5h |
  | `last_field_updated` | `story_points` | `status` | `status` | — | both sides agree; not a conflict |
  | EOF trailing newline | present | stripped | present | ours | ambient writer churn, not authored intent |

  No `fields.intent_uid` / `story_uid` / `capability_uid` was touched, and no
  content absent from both sides was invented.

## Incoming changes preserved

The incoming commit's sole substantive change is the status advance
`free_coded` -> `ready_to_reconcile` (with its `updated_at` /
`last_field_updated` bookkeeping). That change is **present in HEAD via a
later route, not discarded** — this is STEP 4's "redundant commit", not
STEP 3's "discarded commit".

Evidence that `bundled` is strictly downstream of `ready_to_reconcile`, rather
than a competing value for the same fact — `xgd_source/core/ticketing/__init__.py`:

- `_UNBUNDLE_SAFE_STATUSES` (line 5727) = `{ready_to_implement,
  ready_to_reimplement, ready_to_reconcile}`, i.e. `ready_to_reconcile` is one
  of the statuses a member is bundled *from* and restored *to*.
- `unbundle()`'s docstring (line 5736) records that both the manual CLI
  `bundle()` and the dispatcher's `_create_bundle` / `compute_bundle_preview`
  "mark members `status=bundled` / `fields.bundled_in=<anchor>` the same way",
  and the comment above it notes both "only bundle members that were already
  in that exact status".

So HEAD's pair (`status: bundled`, `fields.bundled_in: bundle-8eef3846`) is
exactly the state the bundler emits when it consumes a ticket sitting in
`ready_to_reconcile`. HEAD did not skip or contradict the incoming transition;
it passed through it and advanced one rung further, with the anchor id as the
receipt. Keeping incoming's `ready_to_reconcile` would have *regressed* the
ticket out of its bundle while leaving `bundled_in` dangling.

No BUG-1301 precedence exception was invoked: no hunk was dropped on the
grounds of a prior refactor, and no test function was deleted (no test files
were in this conflict at all).

Net result: the staged blob equals HEAD's blob `57357427`, so this cherry-pick
stages to no diff vs HEAD. Per STEP 4 that is expected and is not a failure —
`cherry_pick_finalize_resolution` will detect the clean staged diff and skip
the commit. `--skip` / `--continue` were NOT called; `CHERRY_PICK_HEAD`
(`6531a2d1f4cc9417b55a492df0554428618ffd6a`) is intact for the next step.
