---
uid: report-5ec4ef75
id: REPORT-7009
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:58:20.338200+00:00'
updated_at: '2026-10-31T21:58:20.338200+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158): intent/bookkeeping ticket (rule 2e). It is outside the sparse cone, so the conflict was in the index only. Two front-matter facts conflicted:
  - `updated_at`: HEAD `2026-09-09T21:32:50` vs incoming `2026-09-02T17:48:27`. Kept HEAD (later).
  - `fields.bundled_in`: HEAD `bundle-87be4669` (BUNDLE-26, created 2026-09-09) vs incoming `bundle-203b1dc2` (BUNDLE-23, created 2026-09-02). Kept HEAD. BUNDLE-26 replaced BUNDLE-23.
  - Resolved with `git checkout --ours` + `git add --sparse`. No conflict markers remain.

## Incoming changes preserved

Not a code file. The incoming commit 2902e1daf1 ("update request request-6893f6ea", 2026-09-02) changed only `updated_at`, `status` (ready_to_reconcile -> bundled) and `bundled_in`. HEAD already has `status: bundled`, and its later `updated_at`/`bundled_in` values supersede the older snapshot. The body is identical on both sides. The resolution has no diff vs HEAD (a redundant commit, per BUG-1109), so the finalize step should treat it as empty.

## Arbitration of last resort (BUG-1460)

- **File:** `.xgd/tickets/hot/request-6893f6ea.md`
- **Tier:** enrichment rule / timeline (take the more recent commit), the same as the identical REQ-161 and request-439cd0c8 conflicts earlier in this reconcile.
- **Evidence:** HEAD's values are from 2026-09-09 and BUNDLE-26. The incoming values are from 2026-09-02 and the superseded BUNDLE-23.
- **Dropped:** the incoming `updated_at` and `bundled_in` values. They are stale, not lost work. Flagged for post-merge review.
