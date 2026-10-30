---
uid: report-ac3224c3
id: REPORT-4586
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:00:05.923363+00:00'
updated_at: '2026-09-21T00:00:05.923363+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket
  (`bundle-*`). Rule **2e** applied. Single conflict region, confined to the
  frontmatter lifecycle block; the ~2600-line body (REQ write-ups, the
  ~150-entry `orphan_commits` list, `fields.commits`) merged cleanly and was
  never in contention.

  Both sides changed the **same fact cluster** — the ticket's lifecycle state —
  to different values, so this is a genuine intent conflict, and 2e's
  later-positioned-intent rule governs, per fact:

  | field | OURS (HEAD) | THEIRS (`44f12ddc80`) | taken |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | OURS |
  | `completed_at` | `2026-08-31T14:22:24` | `null` | OURS |
  | `updated_at` | `2026-08-31T14:23:04` | `2026-08-25T23:30:45` | OURS |
  | `last_field_updated` | `result` | `status` | OURS |

  All four fields are one fact — they move together as a single lifecycle
  transition — so they resolve as a unit rather than being mixed. There were no
  non-overlapping fields on the incoming side to combine: `git show 44f12ddc80`
  confirms its entire diff is 2 insertions / 2 deletions, touching only
  `updated_at` and `status`, both inside the contested block.

  OURS is later on both axes: six days later by timestamp (2026-08-31 vs
  2026-08-25), and further along the lifecycle. The incoming commit records an
  Aug 25 transition `reconciling` → `ready_to_reconcile`; HEAD already carries
  the same bundle at `free_and_reconciled` with `completed_at` set and
  `result: pass`. Taking THEIRS would have regressed a completed bundle back
  into the reconcile queue and dropped its completion timestamp — a stale write
  beating a newer one, which is precisely the lost-update this rule exists to
  prevent.

## Incoming changes preserved

No code, test, or spec-ticket files were in conflict, so STEP 3's
incoming-must-appear check does not apply to any file in this resolution, and
the BUG-1301 PRECEDENCE exception was not invoked.

For the one file resolved: the incoming side's two field values
(`status: ready_to_reconcile`, `updated_at: 2026-08-25T23:30:45`) are
deliberately **not** present in the result. That is the documented outcome of
2e's per-fact later-intent rule on a genuine same-field conflict in a
bookkeeping ticket — not a discard of developer work. The incoming commit
carried no other content: its full diff is the two lines above, both superseded.

**Consequence for the next step:** the resolved tree is byte-identical to HEAD
(`git diff --cached HEAD` is empty), so this patch is now a no-op. Per STEP 4
this was staged and left alone rather than skipped here; the finalize step
should detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD`
(`44f12ddc80`) is intact and untouched.

**Worktree note:** this worktree is a sparse checkout at 11% of tracked files,
and `.xgd/tickets/` is outside the cone — a plain `git add` failed with
"paths ... outside of your sparse-checkout definition". Staging required
`git add --sparse`, per DOC-986 §2/§4.1.
