---
uid: report-e95a31f6
id: REPORT-4144
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:42:20.642307+00:00'
updated_at: '2026-09-13T21:42:20.642307+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — **UU**, index-only (the path sits
  outside the sparse-checkout cone on this reconcile branch). Intent/bookkeeping
  ticket (`bundle-*`) → rule **2e**, together with the auto-enrichment rule for
  this file ("intent unknown on one or both sides — take the more recent commit
  by timestamp and flag for post-merge review").

  Incoming commit: `2ff73d0d1f` (2026-08-31 12:19:32 -0700), a 3-line frontmatter
  change moving `status` from `reconciling` to `free_and_reconciled` and stamping
  `completed_at`.

  The conflict covered only three frontmatter lines; **`status:
  free_and_reconciled` auto-merged** because both sides already agree on it. The
  marker block was edited in place rather than resolved with `checkout --ours`,
  so the auto-merged region was left untouched.

  | field | ours (HEAD) | theirs (`2ff73d0d1f`) | kept |
  |---|---|---|---|
  | `updated_at` | `2026-08-31T19:19:50.607800+00:00` | `2026-08-31T19:19:32.730241+00:00` | ours |
  | `completed_at` | `2026-08-31T19:19:32.487153+00:00` | `2026-08-31T19:19:32.730241+00:00` | ours |
  | `last_field_updated` | `result` | `status` | ours |
  | `status` | `free_and_reconciled` | `free_and_reconciled` | (auto-merged, identical) |

  All three contested lines are the same fact — this ticket's last-update
  bookkeeping — changed differently on each side, so this is 2e's per-fact
  genuine-conflict branch. Ours is the later side on both available measures:
  commit `4b197af0eb` at 12:19:50 -0700 against theirs at 12:19:32 -0700, and
  `updated_at` 19:19:50.607800Z against 19:19:32.730241Z. HEAD's
  `last_field_updated: result` names the subsequent write that theirs predates —
  `result: pass`, present at line 63 of the resolved file and absent from the
  incoming side entirely. Taking theirs would have rolled the bookkeeping back to
  a state that contradicts a field already in the file.

  Flagging for post-merge review per the enrichment rule: neither side declared
  an intent kind, so the choice rests on commit timestamp plus the field ordering
  above rather than on a declared operation narrative.

## Incoming changes preserved

No code or implementation files were in conflict — the single conflicted path is
a bookkeeping ticket, so STEP 3's code-discard guard does not apply. Recording
the substance anyway, and note this is **not** the BUG-1301 precedence exception:
no hunk was dropped as obsolete.

`git show 2ff73d0d1f -- .xgd/tickets/hot/bundle-78f4e2fe.md` is a single hunk
whose substantive change is `status: reconciling` → `status:
free_and_reconciled`, with `updated_at` / `completed_at` / `last_field_updated`
as its bookkeeping. **That change is present in the resolved file** (line 11,
`status: free_and_reconciled`) — it auto-merged rather than conflicting, because
HEAD had independently reached the same status. Only the incoming commit's
accompanying timestamps lost to HEAD's strictly later ones.

So the incoming commit's intent is fully realised in HEAD, by a different route:
this is the redundant-commit case of STEP 4 (BUG-1109/BUG-1122), not a discard.
The staged tree accordingly shows no diff against HEAD for this path. Staged and
exiting `@done` as instructed; `--skip` was not called, and the cherry-pick
sequencer state is intact — `CHERRY_PICK_HEAD` still reads
`2ff73d0d1f04115870687bb9593207260877c197` for
`cherry_pick_finalize_resolution`.
