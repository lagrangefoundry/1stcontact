---
uid: report-6cbc46c4
id: REPORT-6704
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:12:21.913158+00:00'
updated_at: '2026-10-25T23:12:21.913158+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` (REQ-159): intent/bookkeeping ticket (2e), UU. Two same-field conflicts, `updated_at` and `fields.bundled_in`. Applied the enrichment's rule (more recent commit wins) and 2e's later-intent-per-fact rule. Kept HEAD for both facts:
  - HEAD (`c14f78d6d2`, seed_local_overlay, 2026-09-09): `updated_at: 2026-09-09T21:32:49`, `bundled_in: bundle-87be4669` (BUNDLE-26, now `free_and_reconciled`, merged at 66e172dd4c).
  - Incoming (`ed7b3cc779`, update request, 2026-09-02): `updated_at: 2026-09-02T17:48:26`, `bundled_in: bundle-203b1dc2` (BUNDLE-23, the earlier bundle that BUNDLE-26 replaced).
  - The rest of the file (status: bundled, commits, version, body) was the same on both sides.
  - Flagged for post-merge review, as the enrichment's rule requires.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit only advanced REQ-159's bookkeeping to BUNDLE-23. HEAD already has a later state for the same facts (re-bundled into BUNDLE-26), so the incoming change is out of date, not discarded developer work. The staged result is identical to HEAD, so finalize should detect an empty diff and skip the commit (per STEP 4, the resolver did not run --skip).

## Arbitration of last resort (BUG-1460)

STEP 3h was not needed. The per-fact timestamp and later-intent rule settled both facts.
