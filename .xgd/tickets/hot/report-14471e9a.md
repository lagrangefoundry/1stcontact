---
uid: report-14471e9a
id: REPORT-4575
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:30:14.022554+00:00'
updated_at: '2026-09-20T23:30:14.022554+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (class 2e).
  Incoming is `2c208ef37d63b2214dc1177872eb471d22d019ca`
  ("xgd(ticket): update bug bug-a98fb3b0", 2026-08-24 15:19:54 -0700), a
  three-line bookkeeping edit: it adds `story_points: 2` to `fields:`, sets the
  `last_field_updated` breadcrumb to `story_points`, and bumps `updated_at` to
  `2026-08-24T22:19:54`.

  A full `diff` of stage `:2:` (ours) against stage `:3:` (theirs) shows ours is
  a strict superset. Incoming's one substantive addition — `story_points: 2` —
  is already present in ours and byte-identical (it appears in the diff only as
  an unchanged context line). The prose body is identical on both sides (zero
  delta). Ours additionally carries `bundled_in: bundle-78f4e2fe` and the later
  lifecycle state: `status: free_and_reconciled`, `updated_at`/`completed_at:
  2026-08-31T19:19:34`.

  Rule applied: 2e strict-superset — kept the superset. Four facts differ
  (`status`, `updated_at`, `completed_at`, `last_field_updated`); none is a
  competing edit. Ours is the later-positioned intent (2026-08-31 vs
  2026-08-24), `free_and_reconciled` is the downstream lifecycle successor of
  incoming's `free_coded`, and `last_field_updated` is a derived breadcrumb
  naming whichever field changed most recently — ours correctly reads `status`
  because the 08-31 reconcile edit superseded incoming's 08-24 `story_points`
  write. Per-fact timeline arbitration therefore lands on ours for all four; no
  fact was resolved against the later intent.

  Resolved with `git checkout --ours --`, staged with `git add --sparse` (path
  is outside this worktree's 11% sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: the field introduced by `2c208ef`,
  `story_points: 2`, is present verbatim in the resolved version — verified by
  diffing the two conflict stages directly, where it shows zero delta and
  appears only as context. The full prose body (Symptom, Root cause, Fix, Test
  plan) is likewise unchanged between the sides. Nothing from the incoming side
  was discarded; the only incoming values not carried forward are the two
  self-superseding timestamp/breadcrumb fields described above.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply
here. No code or UAT test files were involved in this conflict.

## Staging state

`git status --porcelain` is empty — the UU line is gone and no conflict classes
remain. The resolution is byte-identical to HEAD (expected: incoming's
`story_points` addition had already been carried forward into HEAD's later
revision of the same ticket), so the staged diff is clean. Per instructions I
did NOT call `--skip`; Python's finalize step will detect the empty staged diff
and skip the commit. CHERRY_PICK_HEAD is still present at `2c208ef` — the
cherry-pick was not continued, skipped, quit, or aborted.
