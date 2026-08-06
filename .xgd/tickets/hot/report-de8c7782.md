---
uid: report-de8c7782
id: REPORT-1505
type: report
title: 'Sync-main review: reconcile-BUNDLE-14'
created_by: xgd
created_at: '2026-08-06T22:33:22.568594+00:00'
updated_at: '2026-08-06T22:33:22.568594+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-14
---

{
  "findings": [
    {
      "risk": "LOW",
      "file": "tests/req20-site-fidelity.test.ts",
      "description": "This is the only file present on main that is absent from the branch worktree. It is NOT a rebase-induced revert: branch commit 3c8970b8e ('feat(l1): palette colour model, retrofit sites, retire the token palette [FREE-CODED]') deletes it deliberately. The test exercises APIs the bundle intentionally retires - it calls generateThemeCss({ palette: {...} }), but the signature is now generateThemeCss(tokens?: DeepPartial<ThemeTokens>) with colour moved off the token surface to the L1 palette model (packages/framework/src/tokens/css.ts:14-15, DOC-23 SS5), so the test could no longer compile. Replacement coverage was added in the same bundle (tests/req114-palette-model.test.ts, +303 lines), and tests/req36-heading-treatment.test.ts:36 documents the retirement explicitly. Full suite is green. Informational only."
    },
    {
      "risk": "OK",
      "file": "(repo-wide)",
      "description": "No unresolved conflict markers anywhere in the worktree (grep for <<<<<<< / ======= / >>>>>>> across all files: no matches). No rebase-merge/ or rebase-apply/ directory; working tree clean."
    },
    {
      "risk": "OK",
      "file": "(repo-wide)",
      "description": "No deletion reverts. The briefing's 'Changed Files' direction is branch->main, i.e. inverted relative to the prompt's description: entries marked '(deleted)' are files the BRANCH ADDS (absent on main), and the single '(added)' entry is the file the branch removes. All 11 briefing-'(deleted)' paths - packages/site-schema/src/l1/palette.ts, tools/generate/src/cli/colors.ts, storage/sites/xgd/draft/pages/whitepapers.json, tests/bug31-sandbox-r2-namespace.test.ts, tests/req114-palette-model.test.ts, tests/req116-edit-render.test.ts, and the five reconciliation-*.test.ts files - were verified by git history to be branch-authored additions (commits 3c8970b8e, ecd3d4593, 4abd786f2, 2defd3302, 22c32a616, 3f2864f30, ef6fcc745, e9f9650b1), none of which are ancestors of main. None ever existed on main, so none can be a resurrection of a main-side deletion."
    },
    {
      "risk": "OK",
      "file": "(repo-wide)",
      "description": "Structural guarantee against semantic reverts: merge-base(HEAD, main) = 4ea81ef2b = main~3, and that commit is an ancestor of HEAD. The branch therefore contains the whole of main's code history. Main's only three unmerged commits (93bc73c83, 5ee94afbe, 8e9ad4851) touch .xgd/tickets/hot/ ticket files exclusively and no code. There is consequently no window in which a rename, value change, or code move made by main could have been silently reverted by the replay - every code difference between HEAD and main is branch work layered on top of main's tip state."
    },
    {
      "risk": "OK",
      "file": "(repo-wide)",
      "description": "No integration inconsistencies from the replay. Full suite run (pnpm test): 162 test files passed, 1 skipped; 1140 tests passed, 9 skipped; 0 failures, 72.76s. Symbol removals in the bundle (modules/dials.ts, tokens/contract.ts, tokens/index.ts, modules/index.ts, types.ts) leave no dangling references."
    }
  ]
}
