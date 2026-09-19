---
uid: report-5316dce9
id: REPORT-4362
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:30:15.553143+00:00'
updated_at: '2026-09-19T09:30:15.553143+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming commit 9e4bad08e6 (2026-08-31T14:22:25Z) advances BUNDLE-20 from
  `reconciling` to `free_and_reconciled` and sets `completed_at`. The
  `status: free_and_reconciled` line merged CLEANLY — both sides already agree
  on it. The conflict was confined to three metadata lines:

  - incoming: `updated_at: 14:22:25.238981`, `completed_at: 14:22:25.238981`,
    `last_field_updated: status`
  - HEAD (8e07e6015d, 14:23:04Z, 39s later): `updated_at: 14:23:04.453705`,
    `completed_at: 14:22:24.820529`, `last_field_updated: result`

  Same three facts on both sides, so the later-positioned intent wins per fact
  — HEAD for all three. HEAD's `last_field_updated: result` is coherent with
  the `result: pass` field that sits in the cleanly-merged body; taking the
  incoming block would have rewound `last_field_updated` to `status` while
  `result: pass` remained in the file. The two `completed_at` values are the
  same event ~0.4s apart, recorded by the two branch timelines.

  Resolved with `git checkout --ours` + `git add --sparse`.

  Note: bundle-b3b7c399 is BUNDLE-20, not the bundle under reconcile
  (bundle-8e1807f6 / BUNDLE-27) — ambient bookkeeping drift on an unrelated
  bundle's status ledger, not developer code.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted file is a
bookkeeping ticket (2e), not matrix state or source.

The incoming commit's operation is present in HEAD, not discarded. HEAD
carries its own counterpart commit a0b52c93a6 at the IDENTICAL timestamp
(2026-08-31T07:22:25-0700), making exactly the same transition:
`status: reconciling -> free_and_reconciled` with `completed_at` set and the
`commits` list collapsed. HEAD then wrote `result: pass` on top
(8e07e6015d). So the incoming's key change reached HEAD via a different
route — the BUG-1109/BUG-1122 redundant-commit case, not the STEP 3 discard
case.

Consequently the staged tree nets to no diff vs HEAD
(`git diff --cached HEAD` is empty). Per STEP 4, `--skip` was NOT invoked;
the resolution is staged and CHERRY_PICK_HEAD (9e4bad08e6) is intact for
cherry_pick_finalize_resolution.

No BUG-1301 precedence exception was invoked; no test functions were touched.
