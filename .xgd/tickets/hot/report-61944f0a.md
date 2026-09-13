---
uid: report-61944f0a
id: REPORT-4178
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:47:29.280435+00:00'
updated_at: '2026-09-13T23:47:29.280435+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` (REQ-155) — **UU**, sparse-excluded
  (index-only conflict, no working-tree markers). Rule **2e** (intent/
  bookkeeping ticket — `request-*`, user-authored content, not matrix state).
  Resolved per-fact to the OURS side; staged with `git add --sparse`.

## Per-fact analysis

The document body is byte-identical across all three stages (`:1`, `:2`, `:3`).
The sole contended region is the YAML frontmatter:

| fact | base | incoming (25fa2b65, 2026-09-01 12:02) | HEAD (0de019bb `seed_local_overlay`, 2026-09-11 14:08) |
|---|---|---|---|
| `status` | `free_coded` | `ready_to_reconcile` | `bundled` |
| `last_field_updated` | `story_points` | `status` | `status` (identical to incoming) |
| `updated_at` | 18:57:59 | 19:02:00 | 2026-09-11T18:53:53 |
| `bundled_in` | absent | untouched | `bundle-8e1807f6` (HEAD-only addition) |

- `status` — genuine same-fact conflict. HEAD's intent is later by timeline
  (Sep 11 vs Sep 1), so 2e's later-intent rule takes OURS. This is also
  semantically monotonic: `bundled` is downstream of `ready_to_reconcile` in
  the request lifecycle, and the HEAD-side value was written by the
  `seed_local_overlay` commit for *this* reconcile bundle (bundle-8e1807f6).
  Taking incoming would have regressed the ticket's status.
- `last_field_updated` — both sides agree on `status`; nothing to reconcile.
- `updated_at` — carried with the winning `status` fact.
- `bundled_in` — non-overlapping HEAD-only field; incoming never touched it,
  so it is kept (2e: apply both where disjoint).

Incoming contributed no field that HEAD did not also touch later, so there was
no disjoint incoming edit to combine in.

## Incoming changes preserved

Not a code file, but the STEP 3 check applies and passes: the incoming
commit's only intent is advancing REQ-155 out of `free_coded` toward
reconcile. That change IS present in HEAD, via a further-advanced route —
HEAD already records `status: bundled` plus `bundled_in: bundle-8e1807f6`,
which is strictly downstream of the incoming `ready_to_reconcile`. This is
the redundant case (BUG-1109/BUG-1122), not the discarded case: nothing the
developer wrote is absent from the result.

Consequently the staged diff against HEAD is empty (`git diff --cached HEAD`
reports no changes). Per STEP 4 this is not a failure and `--skip` was NOT
called; the finalize step will detect the clean staged diff and skip the
commit. No BUG-1301 precedence exception was invoked — no hunk was dropped.

## Tree state

`git status --porcelain` is empty (no UU/AA/DU/UD remaining).
`CHERRY_PICK_HEAD` still resolves to 25fa2b6593b2dff25be52e6f546c559460176b96 —
the cherry-pick sequencer state is intact for
`cherry_pick_finalize_resolution`.
