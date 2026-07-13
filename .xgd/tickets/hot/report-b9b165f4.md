---
uid: report-b9b165f4
id: REPORT-542
type: report
title: 'Sync-main review: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T22:05:38.685558+00:00'
updated_at: '2026-07-13T22:05:38.685558+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-5
---

{
  "findings": [
    {
      "risk": "CRITICAL",
      "file": "packages/framework/src/modules/gradient.ts",
      "description": "Reconciled main (c062cab8, tagged sync_main_prep@done) ADDED this new module and registered it in modules/index.ts (2 refs). HEAD (868b6449) dropped the file entirely and removed its registration (0 refs). Main's addition was reverted."
    },
    {
      "risk": "CRITICAL",
      "file": "packages/framework/src/modules/text-markup.ts",
      "description": "Main DELETED this module (consolidated) and removed it from modules/index.ts. HEAD resurrected the file and re-registered it (2 refs in index.ts). Older-than-main resurrection: xgd-working still carries this file and the sync took working's side."
    },
    {
      "risk": "CRITICAL",
      "file": "packages/framework/src/modules/text-style.ts",
      "description": "Main DELETED this module; HEAD resurrected it. Same wholesale-revert shape as text-markup.ts."
    },
    {
      "risk": "CRITICAL",
      "file": "tests/reconciliation-framework-content-modules.test.ts",
      "description": "Representative of ~18 reconciliation-*.test.ts files main ADDED (reconciliation-capture*, -framework-*-modules*, -values-diff*, -req14/15/16/32, -site-schema*, -platform-scaffold, -launcher, etc.). ALL were deleted in HEAD, and the old req49-57/req36-*/req41-42 test files main had DELETED were re-added. Main's entire reconciliation test suite was reverted."
    },
    {
      "risk": "CRITICAL",
      "file": "packages/framework/src/modules/index.ts",
      "description": "Wholesale semantic revert of main's intent. git diff c062cab8(reconciled main)->HEAD is the exact inverse of reconcile bundle 5811871f: 31 of main's additions dropped (D), 31 of main's deletions resurrected (A), 72 modified files reverted to pre-reconcile xgd-working content. strict_advance passed against the stale local baseline, but sync_main resolved every conflict on xgd-working's (older) side, discarding main's complete reconciled bundle. No conflict markers remain, so this passed silently."
    }
  ]
}
