---
uid: report-986c51e4
id: REPORT-4589
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:12:48.798512+00:00'
updated_at: '2026-09-21T00:12:48.798512+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Outside the sparse-checkout cone (11% checkout), so the
  conflict existed only in the index with no working-tree markers;
  resolved with `git checkout --ours` + `git add --sparse`.

  Per-fact resolution (2e: non-overlapping fields → apply both; same
  field changed differently → later-positioned intent wins, per fact):

  | fact | ours (HEAD) | theirs (244ac3569b) | resolution |
  |---|---|---|---|
  | `fields.bundled_in` | `bundle-78f4e2fe` | `bundle-78f4e2fe` | identical — no conflict, value preserved |
  | `status` | `free_and_reconciled` | `bundled` | ours — later intent (see below) |
  | `updated_at` | `2026-08-31T19:19:36` | `2026-08-26T17:36:27` | ours — later |
  | `completed_at` | `2026-08-31T19:19:36` | `null` | ours — set by the terminal transition |
  | body (`## Symptom` … end, 180 lines) | — | — | byte-identical on both sides apart from a trailing newline ours adds; no conflict |

  This matches the auto-enrichment rule for this file ("take the more
  recent commit by timestamp"), and the timestamp ordering is
  independently corroborated by HEAD's own commit history (below)
  rather than resting on `updated_at` alone.

## Incoming changes preserved

Incoming commit `244ac3569b` carries exactly three facts:
`status: ready_to_reconcile → bundled`, an `updated_at` bump, and
`+ fields.bundled_in: bundle-78f4e2fe`.

- **`fields.bundled_in: bundle-78f4e2fe` — PRESENT** in the resolved
  file, verbatim.
- **`status: bundled` — intentionally not present**, and this is not a
  discarded developer change. HEAD's own history for this file already
  contains that exact transition and then supersedes it:

  - `501a0595d1` — sets `status: bundled` **and** `bundled_in:
    bundle-78f4e2fe` (the same change `244ac3569b` carries)
  - `5a37f67dcd` — advances to `status: free_and_reconciled`, matching
    the branch commit `acb0d7985c xgd(reconciliation): terminal state
    complete`

  Verified with `git log -p -- .xgd/tickets/hot/bug-6612c4b7.md`. So
  the incoming bundling transition is already integrated into HEAD; the
  only divergence is that HEAD has since progressed one lifecycle step
  further. Taking `theirs` would have regressed a completed ticket back
  to an intermediate state and nulled out `completed_at` — a loss, not a
  preservation. No BUG-1301 precedence exception was needed; this is the
  ordinary 2e per-fact rule.

- `244ac3569b` is **not** an ancestor of HEAD (`git merge-base
  --is-ancestor` → false), so this is a genuine replay of an
  already-applied transition arriving via a different path, not a
  double-count of the same commit.

## Staging state

`git status --porcelain` is empty: no unmerged entries, and the staged
tree is identical to HEAD (the resolution equals HEAD, since HEAD
already contains everything the incoming commit contributes). Per STEP
4, `--skip` was **not** invoked — finalize will detect the clean staged
diff and skip the commit. `CHERRY_PICK_HEAD` is intact at
`244ac3569bb2eebb397f9c2041b8a19e864e0f5c`.
