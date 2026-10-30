---
uid: report-87ef78f4
id: REPORT-4590
type: report
title: 'Resync resolve conflicts: 98a3f46f0686f7938da5bfd7a986db0aae91be97'
created_by: xgd
created_at: '2026-09-21T00:18:47.150476+00:00'
updated_at: '2026-09-21T00:18:47.150476+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — intent/bookkeeping ticket (`bug-*`), conflict class `UU`.
  Rule applied: **strict-superset wins** (intent/bookkeeping ticket rule). Kept the HEAD side.
  - Conflicted facts were `status`, `updated_at`, `completed_at` (`last_field_updated: status` was
    identical on both sides).
  - HEAD: `status: free_and_reconciled`, `updated_at`/`completed_at` `2026-08-31T19:19:34.607453+00:00`.
  - Incoming (`98a3f46f06`, 2026-08-26): `status: bundled`, `updated_at 2026-08-26T17:36:27.313051+00:00`,
    `completed_at: null`.
  - HEAD is strictly downstream on the documented lifecycle
    (`draft → free_coding → free_coded → ready_to_reconcile → [reconcile/bundle] → free_and_reconciled`),
    so the HEAD side is the superset for every conflicted field. `free_and_reconciled` is written by
    merge-back on success and is terminal; taking the incoming side would have regressed the ticket's
    status and cleared a populated `completed_at`.
  - Resolution was decided on lifecycle position, not on raw `updated_at` comparison (per BUG-1030 /
    REQ-816, which removed the most-recent-`updated_at`-wins merge driver).

## Incoming changes preserved

No code files were in conflict — the cherry-pick touched a single ticket file.

Commit `98a3f46f06` made two changes to `.xgd/tickets/hot/bug-a98fb3b0.md`:

1. `fields.bundled_in: bundle-78f4e2fe` (added) — **present in the resolved version**. This hunk merged
   cleanly; HEAD already carried the identical value, so it survives untouched in the staged file.
2. `status: ready_to_reconcile → bundled` plus the matching `updated_at` bump — **superseded, not
   discarded**. HEAD reached this state and then advanced past it: the ticket went on through
   reconciliation to `free_and_reconciled` on 2026-08-31, five days after the incoming commit. The
   incoming intent (this bug is bundled into `bundle-78f4e2fe`) is fully represented in the resolved
   file via `fields.bundled_in`; only the now-stale status label and its timestamp were dropped.

Net effect: the staged tree is byte-identical to HEAD (`git diff --cached HEAD` is empty). Per STEP 4
of the resync stage-resolution contract this is the documented empty-net-diff case — no incoming
information was lost, an earlier point in the resync queue already landed this commit's surviving
effect. Staging left clean for the Python finalize step; `--skip` deliberately not called from this
session.
