---
uid: report-fd3acbf9
id: REPORT-4126
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:20:05.063438+00:00'
updated_at: '2026-09-12T20:20:05.063438+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (rule 2e).
  Both sides edited the SAME facts (`updated_at`, `status`, plus HEAD-only
  downstream fields), so the per-fact timeline rule applies:
  - Incoming (eb5865434, 2026-08-26T17:36:45Z): `status: ready_to_reconcile ->
    reconciling`, `updated_at` bumped. Nothing else.
  - HEAD (8e07e6015, 2026-08-31T14:23:04Z): `status: free_and_reconciled`,
    `result: pass`, `completed_at` set, `orphan_commits` map + `merged_at_commit:
    eef7a8b48` recorded, commit list collapsed to the merged entry.

  HEAD's intent is later-positioned on the working timeline (2026-08-31 vs
  2026-08-26) for every contested fact, and there are no disjoint facts on the
  incoming side to compose in — the incoming diff touches only the two fields
  HEAD also rewrote. Resolved by taking ours; stage-2 blob (bb444506b) is
  byte-identical to `HEAD:.xgd/tickets/hot/bundle-b3b7c399.md`, so the
  resolution is exactly HEAD with no marker residue. Staged with
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2).

## Incoming changes preserved

No code/implementation files were involved; the sole conflict is a bookkeeping
ticket. The incoming commit's intent is PRESENT IN HEAD VIA A DIFFERENT ROUTE,
not discarded: `xgd ticket history bundle-b3b7c399` shows HEAD's own lineage
passed through `status: reconciling` (present at 2026-08-31T05:05:42Z, seen in
the parent of a0b52c93a) and then advanced to `free_and_reconciled` in
a0b52c93a, with `result: pass` added in 8e07e6015. Re-applying the incoming
`ready_to_reconcile -> reconciling` transition would regress the bundle's
lifecycle state backwards past its own completion.

Consequently the staged diff vs HEAD is empty (`git diff --cached HEAD` shows
no changes) — the BUG-1109/BUG-1122 redundant-commit case, not a discard.
Per STEP 4, no `--skip` was issued; finalize will detect the empty staged diff.
CHERRY_PICK_HEAD (eb5865434) is still present.

No BUG-1301 precedence exception was invoked (no hunks dropped on refactor
grounds). Flagging for post-merge review as the enrichment rule requests, though
the timeline here is unambiguous.
