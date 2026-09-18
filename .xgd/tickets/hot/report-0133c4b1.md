---
uid: report-0133c4b1
id: REPORT-4312
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:44:59.388813+00:00'
updated_at: '2026-09-18T05:44:59.388813+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — UU, intent/bookkeeping ticket
  (rule 2e). Incoming commit `c1d2a2ff87` ("xgd(ticket): update bug
  bug-db356ff8", 2026-08-23 18:48:30 -0700) vs HEAD. Applied the
  **strict-superset** branch of 2e: kept the HEAD side wholesale.

  This is the immediate successor of `5af1ff949d` (resolved the same way in the
  previous attempt in this sequence). It is a pure frontmatter transition — no
  body change at all:

  - `status: draft` → `free_coding`, `last_field_updated: body` → `status`,
    `updated_at` bumped to `2026-08-24T01:48:29Z`;
  - `fields.story_points: 3` added;
  - trailing newline removed at EOF.

  A three-way diff of index stage 3 (incoming) against stage 2 (HEAD) shows
  HEAD already carries `last_field_updated: status`, `fields.story_points: 3`
  and the no-EOF-newline form, and additionally holds `fields.commits`
  (working_sha `ea48502d0d`), `fields.version: 0.2.10`,
  `fields.bundled_in: bundle-78f4e2fe`, `completed_at: 2026-08-31T19:19:38Z`
  and `status: free_and_reconciled` — none of which the incoming side has. The
  single genuinely conflicting fact is `status`, and HEAD's
  `free_and_reconciled` is the strictly later position on the same lifecycle
  (2026-08-31 vs 2026-08-24) than the incoming `free_coding`. Taking the
  incoming side would have rewound a completed, bundled, version-stamped
  ticket back to mid-coding and dropped its reconcile bookkeeping.

## Incoming changes preserved

Confirmed by diffing index stage 3 against stage 2 directly: the only
differences are `updated_at`, `completed_at`, `status`, and the three extra
`fields.*` entries HEAD holds and the incoming side lacks. Every substantive
addition the incoming commit makes is already present in HEAD:

- `fields.story_points: 3` — present;
- `last_field_updated: status` — present;
- the EOF-newline removal — already applied;
- the `status` advance — superseded by a later value on the same lifecycle,
  not discarded.

The bodies are byte-identical, so no narrative content was lost. No
code/implementation files were in conflict, so STEP 3's per-code-file check
has no other subject, and no hunk was dropped under the BUG-1301 precedence
exception.

Net effect: the staged resolution is byte-identical to HEAD, i.e. this
cherry-pick has no residual diff. Per STEP 4 that is not a failure and
`--skip` was NOT invoked — the tree is staged with `CHERRY_PICK_HEAD` intact
(verified present) for `cherry_pick_finalize_resolution` to handle.
