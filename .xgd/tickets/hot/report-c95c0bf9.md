---
uid: report-c95c0bf9
id: REPORT-4574
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:29:21.095219+00:00'
updated_at: '2026-09-20T23:29:21.095219+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (class 2e).
  Incoming is `04957574a547c7ac4869d772bce7c42a5807c40a`
  ("xgd(ticket): update bug bug-a98fb3b0", 2026-08-24 15:19:51 -0700). It
  advances BUG-38 `status: free_coding` -> `free_coded`, bumps `updated_at` to
  `2026-08-24T22:19:50`, and adds two `fields:` entries: a `commits` list
  (`working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411`, `reconcile_sha:
  null`, `main_sha: null`) and `version: 0.2.14`.

  A full `diff` of stage `:2:` (ours) against stage `:3:` (theirs) shows ours is
  a strict superset. Both of incoming's added fields are already present in ours
  and byte-identical — same `commits` list with the same `working_sha`, same
  `version: 0.2.14`. The prose body is identical on both sides (zero delta).
  Ours additionally carries the later lifecycle state:
  `status: free_and_reconciled`, `updated_at`/`completed_at:
  2026-08-31T19:19:34`, `story_points: 2`, `bundled_in: bundle-78f4e2fe`.

  Rule applied: 2e strict-superset — kept the superset. The three differing
  facts (`status`, `updated_at`, `completed_at`) are not competing edits: ours
  is the later-positioned intent (2026-08-31 vs 2026-08-24) and
  `free_and_reconciled` is the downstream lifecycle successor of incoming's
  `free_coded`. Per-fact timeline arbitration therefore also lands on ours; no
  fact was resolved against the later intent.

  Resolved with `git checkout --ours --`, staged with `git add --sparse` (path
  is outside this worktree's 11% sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: both fields introduced by `0495757` are
  present verbatim in the resolved version — the `commits` entry pinning
  `working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411`, and `version:
  0.2.14`. Verified by diffing the two conflict stages directly: those lines
  show zero delta, appearing only as context. The full prose body (Symptom,
  Root cause, Fix, Test plan) is likewise unchanged between the sides. Nothing
  from the incoming side was discarded.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply
here. No code or UAT test files were involved in this conflict.

## Staging state

`git status --porcelain` is empty — the UU line is gone and no conflict classes
remain. The resolution is byte-identical to HEAD (expected: incoming's field
additions had already been carried forward into HEAD's later revision of the
same ticket), so the staged diff is clean. Per instructions I did NOT call
`--skip`; Python's finalize step will detect the empty staged diff and skip the
commit. CHERRY_PICK_HEAD is still present at `0495757` — the cherry-pick was
not continued, skipped, quit, or aborted.
