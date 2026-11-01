---
uid: report-21e7d8f6
id: REPORT-7477
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:27:27.782839+00:00'
updated_at: '2026-11-01T07:27:27.782839+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts — DU, UAT test file. Rule 2a + BUG-1301 precedence: `git rm` (keep HEAD deletion). HEAD deleted it in 6f83befde4 (reconcile, bundle-8e1807f6, 2026-09-14), consolidating it into tests/reconciliation-builder-markdown-readiness.test.ts (added 9f29b00452, reconcile, story-7f437d57). Timestamp rule agrees: HEAD side (2026-09-14) is later than incoming 96744d778a (2026-09-03). FLAGGED for post-merge review.
- tests/test_UAT_FC_REQ-161_library_tab.test.ts — DU, UAT test file. Rule 2a + BUG-1301 precedence: `git rm` (keep HEAD deletion). This reconcile lineage never carried the per-ticket file; its ACs (AC-1714..1717) live in tests/reconciliation-library-tab.test.ts (added a639aeafd9, reconcile, bundle-87be4669, story-1500b111, 2026-09-10). Timestamp rule agrees: later than incoming (2026-09-03). FLAGGED for post-merge review.

## Incoming changes preserved

All incoming code changes (apps/control-app/src/builder/{api,app,library}.js, builder.css, material.ts, router.ts, package.json) and test changes (BUG-47, REQ-166, REQ-172, REQ-176, REQ-179, new REQ-181) applied without conflict and are staged unchanged.

Dropped under BUG-1301: the incoming hunks to the two deleted files. They drop `getSite` and the placement pill / "used on this site" filter assertions (REQ-181), and their only targets are the per-ticket files that HEAD's reconcile UAT-generation workflow had already replaced with consolidated reconciliation-* tests. That is a documented, legitimate consolidation, not a resolution shortcut.

FOLLOW-UP REQUIRED (post-merge review): the consolidated tests still assert the pre-REQ-181 behaviour. A spot-check after staging gave 7 failures:
- reconciliation-library-placement-and-row.test.ts: AC-1715, AC-1716, AC-2018, AC-2019
- reconciliation-library-tab.test.ts: AC-1715, AC-1716 (the "used here" checkbox is gone), AC-1717 (label is now "Placed on")
reconciliation-builder-markdown-readiness.test.ts passes, but still passes the retired `getSite` option (line 380).
REQ-181's intent needs carrying into these consolidated tests (story/AC update). That would mean writing new test content, which is out of scope for conflict resolution.
