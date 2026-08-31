---
uid: report-38a16aa4
id: REPORT-2998
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:26:38.642335+00:00'
updated_at: '2026-08-31T16:26:38.642335+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Conflict existed only in the index; the path is outside the sparse-checkout
  cone on this reconcile branch (DOC-986 §2/§4.1), so there were no working-tree
  markers. Resolved with `git checkout --ours` + `git add --sparse`.

  Cherry-pick in flight: `82518d60` (`xgd(ticket): update bug bug-a98fb3b0`,
  free_coded, 2026-08-24 15:16:15 -0700). This is the second consecutive commit
  in the bundle to conflict on this same ticket; the merge base here (`e7910daa`)
  is the *previous* commit's incoming blob.

  **Why ours:** ours is a content superset, and is later on the only two facts
  that genuinely differ.
  - Incoming (`4ca0044c`) populates the stub with `title`, `severity: high`,
    `status: free_coding`, and the full Symptom / Root cause / Fix / Test plan
    body.
  - Ours (HEAD `cbdfed2e`, `seed_local_overlay`, 2026-08-31 07:24:25 -0700)
    contains that **identical** title, `severity: high`, `chat_comment`, and a
    byte-identical body, plus downstream bookkeeping the incoming side never
    had: `status: bundled`, `commits[].working_sha 63df97c9`, `version: 0.2.14`,
    `story_points: 2`, `bundled_in: bundle-78f4e2fe`.

  Per-fact application of 2e's timeline rule — the two competing facts:
  - `status`: ours `bundled` vs incoming `free_coding`. Ours wins. It is later
    both by commit date (08-31 vs 08-24) and by the ticket's own `updated_at`
    (2026-08-26T17:36 vs 2026-08-24T22:16), and `bundled` is downstream of
    `free_coding` in the lifecycle. Taking incoming would regress the ticket's
    state and delete `bundled_in: bundle-78f4e2fe` — the very bundle this
    reconcile run is executing.
  - `updated_at`: ours 2026-08-26T17:36 is later. Ours wins.

  Every other field and the entire prose body are identical on both sides, so
  nothing else was adjudicated. No content was invented; no field was touched
  beyond choosing between the two sides' existing values.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — PRESERVED. Verified by diffing the
  incoming blob against the staged result (`git diff 4ca0044c :<path>`): the
  only deltas are the two lifecycle fields above (where ours is strictly later),
  the bookkeeping fields ours adds, and a trailing-newline difference. All of
  the incoming commit's substantive authored content is present verbatim in the
  staged blob — title (line 5), `severity: high` (line 18), and the complete
  body: `## Symptom` (28), `## Root cause` (37), `## Fix` (67), `## Test plan`
  (79).

No hunks were dropped; the BUG-1301 precedence exception was not invoked.

## Note for the finalize step

This resolution nets to **no diff vs HEAD** — the staged blob `8645c567` is
HEAD's blob, because the seed_local_overlay commit already carries this
commit's authored content (and more). Per STEP 4 this is the redundant-commit
case (BUG-1109/BUG-1122), not a discard: STEP 3's check distinguishes them, and
it confirms the incoming content is *present* in HEAD rather than absent.
`--skip` was deliberately NOT called; CHERRY_PICK_HEAD is left intact at
`82518d60` for `cherry_pick_finalize_resolution` to handle.
