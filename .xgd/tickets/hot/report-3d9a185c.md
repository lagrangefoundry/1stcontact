---
uid: report-3d9a185c
id: REPORT-4361
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:28:47.563403+00:00'
updated_at: '2026-09-19T09:28:47.563403+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (rule 2e).
  Conflict region was a single 4-line frontmatter block (`updated_at`,
  `completed_at`, `last_field_updated`, `status`); the rest of the file merged
  cleanly. Both sides changed the SAME facts, so the later-positioned intent
  wins per fact — which here is HEAD for all four:
  - incoming (e126b1aa2b, 2026-08-31T05:05:42Z): `status: ready_to_reconcile
    -> reconciling`, `updated_at -> 05:05:42`, `completed_at: null`.
  - HEAD (8e07e6015d, 2026-08-31T14:23:04Z, ~9h later): `status ->
    free_and_reconciled`, `result: pass`, `completed_at: 14:22:24`,
    `merged_at_commit`, ~140 `orphan_commits` entries, `commits` collapsed to a
    single merged entry. HEAD is the strict lifecycle superset: this bundle
    already passed THROUGH `reconciling` and completed.

  Taking the incoming block would have produced an incoherent ticket —
  `status: reconciling` and `completed_at: null` sitting alongside the
  cleanly-merged `result: pass` / `merged_at_commit` / `orphan_commits` that
  only exist on the HEAD side. Resolved with `git checkout --ours` +
  `git add --sparse`.

  Note: bundle-b3b7c399 is BUNDLE-20, not the bundle under reconcile
  (bundle-8e1807f6 / BUNDLE-27) — this is ambient bookkeeping drift on an
  unrelated bundle's own status ledger, not developer code.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted file is a
bookkeeping ticket (2e), not matrix state or source.

The incoming commit's entire intent for this file was "advance
bundle-b3b7c399 to `reconciling`". That intent is present in HEAD via a
different route rather than discarded: HEAD's `free_and_reconciled` /
`result: pass` state is strictly downstream of `reconciling` in the bundle
lifecycle. This is the BUG-1109/BUG-1122 redundant-commit case, not the
STEP 3 discard case — the incoming key change is subsumed by HEAD, not absent
from it.

Consequently the staged tree nets to no diff vs HEAD
(`git diff --cached HEAD` is empty). Per STEP 4, `--skip` was NOT invoked;
the resolution is staged and CHERRY_PICK_HEAD (e126b1aa2b) is intact for
cherry_pick_finalize_resolution to handle.

No BUG-1301 precedence exception was invoked; no test functions were touched.
