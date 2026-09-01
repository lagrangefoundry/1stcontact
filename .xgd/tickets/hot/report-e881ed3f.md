---
uid: report-e881ed3f
id: REPORT-3206
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:44:50.500151+00:00'
updated_at: '2026-09-01T04:44:50.500151+00:00'
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

  Incoming commit: `0941885b` "xgd(ticket): update bug bug-23d1ec27"
  (2026-08-25, free_coded transition).
  Ours (HEAD): blob `52bab41f`, reached via `0929135455`
  (seed_local_overlay) / `fe03200d68` (merge of free-BUG-39), 2026-08-31.

  Per-fact resolution (base `5db68a01` / ours `52bab41f` / theirs `4fc9bbb9`):
  - `fields.commits` (`working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd`,
    `reconcile_sha: null`, `main_sha: null`) — **identical on both sides**;
    kept. This is the incoming commit's primary payload.
  - `fields.version: 0.2.15` — **identical on both sides**; kept. Per
    `ticket_types.yaml`, this field is "set at time of free_coded transition",
    confirming ours already carries the incoming transition's artifacts.
  - `fields.story_points: 3`, `fields.bundled_in: bundle-8eef3846` — present
    only on ours; incoming never touched them (they postdate it). Non-
    overlapping → kept, not dropped.
  - `status`: base `free_coding`; theirs `free_coded`, ours `bundled`.
    Genuine same-fact divergence → timeline rule. Ours is the later-positioned
    side (updated_at 2026-08-31T05:05:09Z vs 2026-08-25T23:28:09Z) and is
    strictly downstream in the lifecycle: `bundled` is the state reached
    *after* `free_coded`, with `bundled_in` recording the absorbing bundle.
    Kept `bundled`.
  - `updated_at` — kept ours (2026-08-31T05:05:09.315020+00:00), consistent
    with the `status` fact above.
  - `last_field_updated: status` — identical on both sides; kept.
  - Body prose — byte-identical on both sides apart from the trailing
    newline, which theirs strips. Kept ours' trailing newline (later side,
    and the only difference is whitespace at EOF).

  Net effect: the resolution is a strict superset of the incoming version, so
  the staged tree is byte-identical to HEAD for this path and the staged diff
  vs HEAD is empty. Per STEP 4 this is the redundant-commit case
  (BUG-1109/BUG-1122), not a discard — `--skip` was NOT called; the finalize
  step will detect the clean staged diff itself.

## Incoming changes preserved

Confirmed. `git show 0941885b -- .xgd/tickets/hot/bug-23d1ec27.md` contains
exactly three substantive changes; all three are present in the resolved
version, reached via a different route (the HEAD-side bundling path) rather
than absent:

1. `fields.commits` with `working_sha: 759cd874...` — present, verbatim.
2. `fields.version: 0.2.15` — present, verbatim.
3. `status: free_coding` → advanced, and `last_field_updated: body` →
   `status` — present; the resolved status is `bundled`, the state that
   *succeeds* `free_coded`, and the free_coded transition's own artifacts
   (items 1 and 2) are intact. The developer's intent is therefore carried,
   not overwritten.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked.
No code, test, or spec-ticket files were involved in this conflict.
