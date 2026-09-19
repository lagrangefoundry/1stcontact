---
uid: report-2cef55dd
id: REPORT-4359
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:23:56.610529+00:00'
updated_at: '2026-09-19T09:23:56.610529+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (rule 2e,
  bundle-* ticket; path is outside the sparse-checkout cone, so staged with
  `git add --sparse`). Resolved by taking the HEAD side in full.

  Per-fact analysis. The incoming commit `aaf472a06e` (authored 2026-08-30
  22:04:25 -0700 = 2026-08-31T05:04:25Z) touches exactly two facts:

    - `updated_at`: 2026-08-30T04:33:05Z -> 2026-08-31T05:04:25Z
    - `status`: `reconciling` -> `ready_to_reconcile`

  The HEAD side changed the same two facts (plus `completed_at`,
  `last_field_updated`, `fields.commits`, `fields.orphan_commits`,
  `fields.merged_at_commit`, `result`), most recently in `8e07e6015d`
  (2026-08-31 07:23:04 -0700 = 2026-08-31T14:23:04Z):

    - `updated_at`: -> 2026-08-31T14:23:04Z
    - `status`: -> `free_and_reconciled`, with `result: pass`,
      `completed_at: 2026-08-31T14:22:24Z` and
      `merged_at_commit: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`

  There are no disjoint facts: every field the incoming side touched is a field
  the HEAD side also touched, and the incoming side adds no body content. So this
  is a same-fact conflict on `status`/`updated_at`, resolved by the timeline rule.
  The conflict enrichment reported intent unknown on both sides, so there are no
  intent uids for `xgd working-timeline`; the enrichment's own fallback ("take the
  more recent commit by timestamp") and rule 2e's later-positioned-intent rule both
  select HEAD, which is ~9h 19m later in wall clock.

  Semantically HEAD is also strictly downstream: bundle-b3b7c399 has completed its
  lifecycle (`free_and_reconciled`, `result: pass`, merged at
  `eef7a8b48b`). Writing the incoming `ready_to_reconcile` back would regress a
  finished bundle to an intermediate state. Note this ticket is bookkeeping for a
  *different* bundle (bundle-b3b7c399) than the one being reconciled here
  (bundle-8e1807f6).

## Incoming changes preserved

No code/implementation files were in conflict; the single conflicted path is a
bookkeeping ticket.

The incoming commit's intent — advance bundle-b3b7c399 past `reconciling` — is
present in HEAD via a later route, not discarded. HEAD passed through
`ready_to_reconcile` and continued on to the terminal `free_and_reconciled` state
with `result: pass` and `merged_at_commit` recorded. This is STEP 4's
redundant-commit case (BUG-1109/BUG-1122), not STEP 3's discard case: the
incoming commit's key change (status advanced off `reconciling`) IS present in
HEAD, superseded by a further advance, rather than simply absent.

Consequently the staged tree has no net diff vs HEAD. Per STEP 4 this is not a
failure and `--skip` was NOT called; the cherry-pick sequencer state is intact
(CHERRY_PICK_HEAD = aaf472a06e) for cherry_pick_finalize_resolution to handle.

No BUG-1301 precedence exception was invoked; no test functions were involved.
