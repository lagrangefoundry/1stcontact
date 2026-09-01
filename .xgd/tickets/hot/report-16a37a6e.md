---
uid: report-16a37a6e
id: REPORT-3209
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:51:20.478793+00:00'
updated_at: '2026-09-01T04:51:20.478793+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (rule 2e).
  Single conflict hunk, four scalar frontmatter fields (`updated_at`,
  `completed_at`, `last_field_updated`, `status`). Both sides changed the SAME
  facts differently, so 2e's per-fact timeline rule applies.
  - Neither side carries an `intent_uid`, so `xgd working-timeline` is not
    applicable. Fell back to the commit-timestamp rule supplied by the conflict
    enrichment metadata.
  - HEAD side (`8e07e6015d`, 2026-08-31 07:23 -0700): `status: free_and_reconciled`,
    `completed_at: 2026-08-31T14:22:24Z`, `last_field_updated: result`.
  - Incoming side (`44f12ddc80`, 2026-08-25 16:30 -0700): `status: ready_to_reconcile`,
    `completed_at: null`, `last_field_updated: status`.
  - HEAD is the later-positioned side by ~5 days, and `free_and_reconciled` is the
    terminal state of the lifecycle whose earlier waypoint `ready_to_reconcile` is.
    Kept HEAD for all four facts. Staged with `git add --sparse` (path is outside
    the sparse-checkout cone, DOC-986 §2/§4.1).
  - Everything outside the hunk auto-merged from HEAD and was preserved verbatim:
    the collapsed `fields.commits` entry with
    `main_sha: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`, the 140-entry
    `fields.orphan_commits` map, `fields.merged_at_commit`, and `result: pass`.
    Verified `git diff HEAD -- <path>` is empty, i.e. the resolution is exactly
    HEAD's blob with no auto-merged content silently dropped.

Result nets to no diff vs HEAD. Per STEP 4 / BUG-1109 / BUG-1122 this is staged
and exited @done as normal; `--skip` was NOT called. CHERRY_PICK_HEAD
(`44f12ddc803368ccc23b0e0f457cf48ef2d39f5e`) is intact for
cherry_pick_finalize_resolution.

## Incoming changes preserved

No code/implementation files were in this conflict — the only conflicted path is a
bookkeeping ticket, so the 2c "incoming is authoritative" hard rule (scoped to code
files) does not govern; 2e does.

STEP 3 redundant-vs-discarded determination for the one incoming fact:

- The incoming commit's literal value `status: ready_to_reconcile` does not appear
  anywhere in HEAD's history for this file. `git log -p` over
  `.xgd/tickets/hot/bundle-b3b7c399.md` on HEAD shows the status field going
  `reconciling` (at file creation, `4b7f40157d`) directly to `free_and_reconciled`
  (at `a0b52c93a6`, 2026-08-31); the intermediate waypoint was never recorded on
  this branch.
- This is REDUNDANT, not DISCARDED. The effect the incoming commit was a step
  toward — bundle-b3b7c399 advancing out of `reconciling` and through the reconcile
  pipeline — is fully realised in HEAD via a different route: the bundle reached
  the terminal `free_and_reconciled` with `result: pass`, a populated
  `orphan_commits` map, and `merged_at_commit: eef7a8b48b`. Re-applying
  `ready_to_reconcile` would regress a completed bundle to a pre-reconcile state.
- Rule 2e explicitly authorises taking the later-positioned side per fact when both
  sides changed the same field differently, which is exactly this case. No developer
  code was overwritten.

FLAGGED FOR POST-MERGE REVIEW, per the enrichment metadata's instruction ("Take the
more recent commit by timestamp and flag this file for post-merge review"): a human
may wish to confirm that bundle-b3b7c399's terminal state on the reconcile branch is
the intended one, given the xgd-working side still believed the bundle was only
`ready_to_reconcile` as of 2026-08-25.
