---
uid: report-dff3befc
id: REPORT-1509
type: report
title: 'Sync-main review: reconcile-BUNDLE-14'
created_by: xgd
created_at: '2026-08-06T22:43:13.612761+00:00'
updated_at: '2026-08-06T22:43:13.612761+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-14
---

```json
{
  "findings": [
    {
      "risk": "MEDIUM",
      "file": "tests/req20-site-fidelity.test.ts",
      "description": "This is the only file removed by the branch relative to main (git diff --diff-filter=D main..HEAD returns exactly this path). It was deleted by branch commit b20671ee6 'feat(l1): palette colour model … retire the token palette' and carried all three test_UAT_FC_REQ-20_* UATs; after the deletion HEAD has zero test_UAT_FC_REQ-20_* functions anywhere in tests/ (only a prose mention of REQ-20 inside tests/req47-fidelity-structural.test.ts). The deletion is coherent with declared branch intent rather than a silent revert: the three UATs asserted generateThemeCss emitting --color-secondary / --color-accent-mid and TREATMENT_ROLE_DIAL containing 'accent-mid', i.e. exactly the closed 15-slot token palette the commit body states is 'deleted, not deprecated'. Downgraded from HIGH because it is a declared supersession of a capability, not a regression of behaviour main added — but the commit body justifies only the analogous req33 AC4 removal ('Coverage moved to the palette model's own UATs'), never the wholesale req20 file deletion, and no replacement REQ-20 UAT was authored. REQ-20's capability is now unevidenced in the matrix."
    },
    {
      "risk": "LOW",
      "file": "tests/req33-verbatim-fidelity.test.ts",
      "description": "Line 5 imports TREATMENT_ROLE_DIAL from packages/framework/src/modules/dials, but b20671ee6 deleted that export (confirmed: the only occurrence of the symbol in the entire repo is this import line; dials.ts exports no such const). The same commit removed the two test bodies that used it but left the import statement behind. Verified non-breaking: esbuild elides the unused TS import, so `npx vitest run tests/req33-verbatim-fidelity.test.ts` passes 9/9 and the full suite passes 1140 tests / 162 files. It will not be caught by the tsc build gate either, since no tsconfig (root tsconfig.base.json has no include; the package tsconfigs scope to src/**) covers tests/. Dead reference to a non-existent export — hygiene debt from an incomplete cleanup, not a functional regression. The adjacent `generateThemeCss, defaultTokens` import on line 6 is likewise now unused (those exports do still exist)."
    },
    {
      "risk": "OK",
      "file": "packages/framework/src/modules/",
      "description": "No semantic revert of main's intent detected. main (93bc73c8) is a strict ancestor of HEAD (git merge-base HEAD main == main), so nothing main did can be missing by omission. Checked all three shapes: (a) deletion revert — every file main deleted in its recent commits (d37af07ca, 47aba3435, 613f2d6dc: hero/header/footer/layer/services-grid/text-block modules, background.ts, motion.ts, nav.ts, overlay.ts, row.ts, gradient.ts, and six retired test files) is confirmed still absent from the worktree, and `git ls-tree main packages/framework/src/modules/` is byte-identical to the directory listing in HEAD; (b) rename/move revert — no added line in main..HEAD across packages/tools/apps mentions services-grid, a 'hero'/'header'/'footer'/'layer' module id, or carousel config.view; (c) value revert — dials.ts's only removal vs main is TREATMENT_ROLE_DIAL, consistent with the declared palette retirement. Note the briefing's Changed Files labels are inverted relative to the procedure's assumption: the entries marked '(deleted)' (palette.ts, colors.ts, whitepapers.json, req114/req116/bug31/reconciliation-colour-* tests) are files ABSENT FROM MAIN and ADDED BY the branch's b20671ee6/e8e9df944/157f044b0 commits — new branch work, not resurrections of main deletions; and the one marked '(added)' is the req20 file covered above."
    },
    {
      "risk": "OK",
      "file": ".",
      "description": "No unresolved conflict markers: grep for '^<<<<<<< ' across .py/.yaml/.yml/.ts/.astro/.json/.md (node_modules excluded) returns nothing, and no .orig or .rej leftovers exist. Working tree is clean. No over-aggressive conflict resolution or integration inconsistency found: the branch carries only three substantive commits on top of main (157f044b0 R2 namespace fix, b20671ee6 palette model, e8e9df944 edit render), all additive apart from the palette retirement, and the full suite is green — 162 files passed / 1 skipped, 1140 tests passed / 9 skipped, 118.6s."
    }
  ]
}
```
