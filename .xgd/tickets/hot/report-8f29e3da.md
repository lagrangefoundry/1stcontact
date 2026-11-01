---
uid: report-8f29e3da
id: REPORT-7701
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:19:36.521719+00:00'
updated_at: '2026-11-01T15:19:36.521719+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `package.json` (UU, config scalar): took HEAD's `"version": "0.2.69"` over incoming `0.2.65`. Following the enrichment rule, HEAD's last change (914b72adac, 2026-11-01, free-REQ-179 merge) is newer than incoming 96744d778a (2026-09-03). Taking incoming would move the version backwards. Flagged for post-merge review.
- `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts` (DU, UAT test): kept deleted (`git rm`). HEAD removed it in 6f83befde4 (2026-09-14, reconcile fix_reconciliation_review, intent bundle-8e1807f6), which is newer than the incoming commit. The incoming hunk only drops one `getSite: () => 'alpha'` line from a `createLibraryPanel` call. Flagged for post-merge review.
- `tests/test_UAT_FC_REQ-161_library_tab.test.ts` (DU, UAT test): kept deleted (`git rm`). This file has never existed in HEAD's history, and the feature commit that added it with the Library tab (05da4252c8) is not an ancestor of HEAD. Restoring it would add a test for code this branch doesn't carry. Flagged for post-merge review.

## Incoming changes preserved

All non-conflicting changes in 96744d778a (material.ts, router.ts, the REQ-181 badges test, the BUG-47/REQ-166/172/176/179 test edits) are already identical in HEAD: `git diff HEAD` outside .xgd shows only the three conflicted paths. The staged resolution nets to no diff vs HEAD because the commit is redundant here, not because anything was discarded.

Dropped hunks (BUG-1301 precedence):
- BUG-42 test: target file removed by 6f83befde4, an integrated reconcile review commit with an xgd intent trailer that also made matching source changes. This was a documented workflow decision, not resolution churn.
- REQ-161 library_tab test: no target on this branch, since the Library-tab feature (05da4252c8) is not integrated into HEAD.

## Arbitration of last resort (BUG-1460)

- `package.json` and both test files: tier 3 timestamp rule from the conflict-intent enrichment ("take the more recent commit"). HEAD is newer in each case, so the incoming side was dropped. No later ticket contradicts this.
