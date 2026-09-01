---
uid: report-626ec4ba
id: REPORT-3207
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:46:33.619629+00:00'
updated_at: '2026-09-01T04:46:33.619629+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — class **UU** (index-only; path is
  outside the sparse-checkout cone, so no working-tree markers existed).
  Rule applied: **2e — intent/bookkeeping ticket**, resolved per-fact.
  Staged via `git checkout --ours --ignore-skip-worktree-bits` +
  `git add --sparse`.

  Incoming commit: `7f1350e9` "xgd(ticket): update bug bug-23d1ec27"
  (2026-08-25T16:28:10 -0700). This is the immediate successor of `0941885b`,
  the commit handled in the previous attempt (70/0) — its merge base blob
  `4fc9bbb9` is exactly that commit's result, so the two form a chain of
  small field writes on the same ticket.
  Ours (HEAD `25ed4795`): blob `52bab41f` — unchanged from the previous
  attempt, confirming finalize correctly skipped the redundant `0941885b`.

  Per-fact resolution (base `4fc9bbb9` / ours `52bab41f` / theirs `2d6d1617`):
  - `fields.story_points: 3` — **this commit's entire substantive payload.**
    Incoming adds it; ours already carries it with the identical value.
    Present in the resolution.
  - `fields.bundled_in: bundle-8eef3846` — ours only; incoming never touched
    it (it postdates this commit). Non-overlapping → kept, not dropped.
  - `status` — incoming did NOT change this field in this commit (base and
    theirs are both `free_coded`). Ours is `bundled`, the downstream state
    reached by the HEAD-side bundling operation. Kept ours; no incoming
    intent is overridden.
  - `updated_at` — same-fact divergence; ours (2026-08-31T05:05:09.315020Z)
    is later on the working timeline than theirs
    (2026-08-25T23:28:10.319611Z). Kept ours.
  - `last_field_updated` — base `status`, theirs `story_points`, ours
    `status`. Same-fact divergence → timeline rule, ours (later) kept. This
    field is a single-valued derived trace of the most recent field write and
    is inseparable from `updated_at`: taking theirs' `story_points` while
    keeping ours' 2026-08-31 `updated_at` would assert that the field written
    at 2026-08-31T05:05:09Z was `story_points`, when the operation at that
    timestamp in fact wrote `status` (→ `bundled`, plus `bundled_in`). Keeping
    ours is the only internally coherent pairing. No developer content is lost
    by this choice — the field it traces, `story_points`, is present.
  - Body prose — byte-identical on both sides apart from the trailing
    newline, which theirs strips. Kept ours' trailing newline (later side;
    the sole difference is whitespace at EOF).

  Net effect: the resolution is a strict superset of the incoming version, so
  the staged tree is byte-identical to HEAD for this path and the staged diff
  vs HEAD is empty. Per STEP 4 this is the redundant-commit case
  (BUG-1109/BUG-1122), not a discard — `--skip` was NOT called; the finalize
  step will detect the clean staged diff itself. `CHERRY_PICK_HEAD` remains
  `7f1350e9`.

## Incoming changes preserved

Confirmed by direct inspection of the staged blob
(`git cat-file -p :.xgd/tickets/hot/bug-23d1ec27.md`):

    23:  version: 0.2.15
    24:  story_points: 3
    25:  bundled_in: bundle-8eef3846

`git diff 4fc9bbb9 2d6d1617` shows this commit's only substantive change is
the addition of `fields.story_points: 3`. That line is present verbatim in
the resolved version, reached via the HEAD-side bundling route rather than
absent — the redundant case, not the discarded one. The two accompanying
lines (`updated_at`, `last_field_updated`) are auto-maintained bookkeeping
metadata, not authored content, and are resolved to the later-timeline side
as recorded above.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked.
No code, test, or spec-ticket files were involved in this conflict.
