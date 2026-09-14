---
uid: report-fd332fde
id: REPORT-4207
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:16:47.316477+00:00'
updated_at: '2026-09-14T03:16:47.316477+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` (BUG-42) — **UU**, intent/bookkeeping
  ticket (rule 2e). Resolved to **ours**. Path is outside the sparse-checkout
  cone (skip-worktree, DOC-986 §2/§4.1), so the conflict existed only in the
  index with no working-tree markers; resolved by pointing the index entry at
  the stage-2 blob (`91ed8fa`) and restoring the `skip-worktree` bit that the
  index write cleared (siblings under `.xgd/tickets/hot/` all carry `S`).

  Conflict was frontmatter-only — the prose body is byte-identical across base,
  ours and theirs. Per-fact resolution:

  | fact | theirs (incoming) | ours (HEAD) | taken |
  |---|---|---|---|
  | `fields.commits` | `working_sha: bd7612f9…` | identical | either (same value) |
  | `fields.version` | `0.2.36` | identical | either (same value) |
  | `status` | `free_coded` | `bundled` | ours |
  | `story_points`, `bundled_in` | absent | `3`, `bundle-8e1807f6` | ours |
  | trailing newline | stripped | kept | ours |

  `status` is the only genuinely competing fact. 2e's timeline rule and the
  auto-enrichment's "more recent commit by timestamp" rule agree and both select
  ours: HEAD-side `79ad55aa` *seed_local_overlay* (Fri Sep 11 14:08:30 2026)
  postdates incoming `488962bd` *update* (Tue Sep  1 14:16:50 2026) by ten days.
  The lifecycle ordering agrees independently — `bundled` is downstream of
  `free_coded`.

## Incoming changes preserved

Incoming commit `488962bd` makes exactly three changes to this file, all
frontmatter:

1. `fields.commits` + `fields.version: 0.2.36` added — **present in HEAD
   byte-identically**, carried by the seed_local_overlay commit. Preserved.
2. `status: free_coding` → `free_coded` — **subsumed, not discarded**. HEAD
   carries `status: bundled`, which is downstream of `free_coded` in the ticket
   lifecycle; the ticket could not be `bundled` without having passed through
   `free_coded`. HEAD additionally records the bundling that happened after the
   incoming branch's last write (`bundled_in: bundle-8e1807f6`). Taking incoming
   here would *regress* the ticket's recorded state.
3. Trailing-newline removal at EOF — cosmetic churn, no developer intent.

No prose/body hunks exist in the incoming diff, so nothing could be dropped
there. No code or test files were involved in this conflict; no hunk was dropped
under the BUG-1301 precedence exception.

Net staged diff vs HEAD is empty — this commit's substantive effect (the
`commits`/`version` fields) had already landed via the seed_local_overlay route,
which is the BUG-1109/BUG-1122 redundant-commit case, not a discard. Per STEP 4,
staged and exiting normally; `--skip` was not called and the cherry-pick
sequencer state (CHERRY_PICK_HEAD `488962bd`) is intact.
