---
uid: report-74e21dd6
id: REPORT-3389
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T22:54:08.638957+00:00'
updated_at: '2026-09-03T22:54:08.638957+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (rule **2e**),
  resolved per-fact toward HEAD via `git checkout --ours` + `git add --sparse`.

  The conflict was confined to four adjacent frontmatter scalars (`updated_at`,
  `completed_at`, `last_field_updated`, `status`) — lines 8–18 of the working file.
  Nothing else from the incoming side merged in: `git diff HEAD` on the conflicted
  working file showed exactly 7 insertions / 0 deletions, i.e. HEAD's content plus the
  conflict block alone.

  | fact | HEAD (`8e07e601`, Aug 31 07:23 -0700) | incoming (`e126b1aa`, Aug 30 22:05 -0700) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `reconciling` |
  | `completed_at` | `2026-08-31T14:22:24Z` | `null` |
  | `last_field_updated` | `result` | `status` |
  | `updated_at` | `2026-08-31T14:23:04Z` | `2026-08-31T05:05:42Z` |

  Both sides changed the SAME facts differently, so 2e's timeline rule applies per-fact.
  Every fact resolves the same direction: HEAD is later by ~9h wall-clock AND strictly
  downstream in the bundle lifecycle. The auto-enriched metadata's fallback rule
  ("intent unknown on one or both sides — take the more recent commit by timestamp")
  points the same way.

## Incoming changes preserved

The incoming commit's sole change is the `ready_to_reconcile` -> `reconciling` status
transition. This is **redundant, not discarded** — HEAD already passed through that exact
state and advanced beyond it. From `xgd ticket history bundle-b3b7c399` on this branch:

- `a0b52c93` (Aug 31 07:22:25 -0700) — `-status: reconciling` / `+status: free_and_reconciled`,
  and sets `completed_at`. The `-` side proves HEAD held `reconciling` before this commit.
- `8e07e601` (Aug 31 07:23:04 -0700) — appends `result: pass`, `last_field_updated: result`.

So the incoming intent reached HEAD by a different route and was then superseded. Applying
the incoming side would have regressed a completed bundle (`free_and_reconciled`,
`result: pass`, `merged_at_commit: eef7a8b4`) back to in-progress and nulled its
`completed_at` — a revert of operator-visible lifecycle state, not an integration.

This is STEP 3's "present via a different route" case, not the "genuinely absent" case,
so it is not an @fail. No BUG-1301 precedence exception was invoked — no hunk was dropped
on refactor grounds, and no test function was touched.

Note per STEP 4: the resolution nets to **no diff vs HEAD**. That is expected here and was
deliberately NOT acted on — `git cherry-pick --skip` was not called, nor any other command
that would end/reset/forget the cherry-pick. `CHERRY_PICK_HEAD` remains present at
`e126b1aa2b97e30c647563a75b6d3572db3426df` for `cherry_pick_finalize_resolution` to detect
the clean staged diff and skip the commit itself.

## Verification

- `git status --porcelain` — 0 lines of conflict class (UU/AA/DU/UD/AU/UA/DD).
- `git diff --name-only --diff-filter=U` — empty.
- `grep -cE '^(<<<<<<<|=======|>>>>>>>)'` on the resolved file — 0.
- `CHERRY_PICK_HEAD` still present and unchanged.

Remaining `??` untracked entries under `.xgd/tickets/hot/` (comment-*, report-*) are
pre-existing out-of-cone ticket files, unrelated to this conflict; left untouched.
