---
uid: report-54acf677
id: REPORT-4773
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T18:54:59.341934+00:00'
updated_at: '2026-09-21T18:54:59.341934+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, intent/bookkeeping ticket
  (STEP 2e). Conflict was confined to four frontmatter fields; the
  entire body was byte-identical on both sides, so only the lifecycle
  facts were in contention.

  | field | ours (HEAD) | theirs (d22ba37c40) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | 2026-09-19T15:15:31 | 2026-09-01T19:34:04 |
  | `completed_at` | 2026-09-14T10:29:13 | `null` |
  | `last_field_updated` | `status` | `status` |

  Both sides changed the SAME fact (`status`, and the `completed_at` /
  `updated_at` that move with it) differently, so 2e's genuine-conflict
  clause applies: take the LATER-positioned intent, per fact. HEAD is
  later on every axis — by `updated_at` (Sep 19 vs Sep 1, an 18-day
  gap) and by lifecycle position (`free_and_reconciled` is downstream
  of `ready_to_reconcile`, which HEAD already passed through). Kept
  HEAD's four values. Confirmed against the live index: `xgd ticket get
  bug-3ade1af4` reports `Status: free_and_reconciled`, matching the
  resolution.

  The incoming commit is a stale replay of the Sep-1 `free_coded ->
  ready_to_reconcile` transition (`git show d22ba37c40` confirms that
  is its only content). Applying it would have rewound BUG-40 two
  lifecycle states and cleared a `completed_at` that a later,
  already-integrated transition set.

  Staged with `git add --sparse` per DOC-986 §2/§4.1 — `.xgd/tickets/`
  is outside the sparse-checkout cone on this resync branch (worktree
  reports 11% of tracked files present).

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's
`git show $CPHEAD -- <file>` verification has no code target.

For the one ticket file, the incoming `status: ready_to_reconcile` is
deliberately NOT present in the resolved version. This is not a
discarded developer change and the BUG-1301 precedence exception is not
being invoked — it is 2e's per-fact later-intent rule resolving a
genuine, same-field conflict in HEAD's favour. The incoming side
carries no other content: its diff against its own parent touches only
`updated_at`, `completed_at`, `last_field_updated`, and `status`, all
four of which are the contested facts.

Because the resolution matches HEAD exactly, the staged diff against
HEAD is empty and this cherry-pick is a no-op. Left staged and the
cherry-pick in progress (CHERRY_PICK_HEAD = d22ba37c40 verified still
present) for the finalize step to handle; no `--continue`, `--skip`,
`--quit`, or `--abort` was issued.

## Verification

- `grep -c '^<<<<<<<\|^>>>>>>>\|^======='` on the resolved file: `0`.
- `git status --porcelain`: empty — no UU/AA/DU/UD lines remain.
