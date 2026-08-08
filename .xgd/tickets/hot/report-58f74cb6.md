---
uid: report-58f74cb6
id: REPORT-1687
type: report
title: 'Sync-main review: branch-BUG-32'
created_by: xgd
created_at: '2026-08-08T00:51:12.058478+00:00'
updated_at: '2026-08-08T00:51:12.058478+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: branch-BUG-32
---

{
  "findings": [
    {
      "risk": "MEDIUM",
      "file": "tests/req115-builder-composition.test.ts",
      "description": "Six UATs fail in this worktree (1 in req115-builder-composition, 5 in reconciliation-copy-edit-gesture-modal), but this is NOT rebase damage. Verified: every production file in the failing paths - apps/control-app/src/builder/{toolbar,panel,main,config,api}.js - is byte-identical to the merge-base (571a3cde). The branch's only apps/ change is three import-specifier lines in app.js/editor.js. These suites are gated by describe.skipIf(!WEBUI_INSTALLED)/it.skipIf(...); on main, resolution from a linked worktree fails for BOTH @gendevlabs and @lagrangefoundry (confirmed MODULE_NOT_FOUND via createRequire simulation), so they SKIPPED and reported green. The branch adds mainCheckout() upward-walk resolution in webui.ts plus vitest resolve.alias entries, which makes the shared store reachable from a worktree and UN-SKIPS them - exposing pre-existing latent defects rather than introducing them. Concretely, test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly fails because the toolbar's subscribe('src', sync) subscription does not survive to re-fire on panel.setSite(); report-26f5747e already recorded this exact guard as 'unproven in this tree'. Component API change was ruled out as the cause: @lagrangefoundry/webui-fields differs from @gendevlabs only additively (new opts.layout, default 'labelled' == prior behaviour), mountFields is the sole export in both, and webui-shell exports are identical. Raising this for the branch's quality/review stage, not the sync-main fix loop, which targets replay artifacts."
    },
    {
      "risk": "OK",
      "file": "index.html",
      "description": "index.html exists in main and is deleted on the branch - checked because this is the shape a deletion-revert takes, but it is deliberate branch intent, not a revert of main. main last touched the file in 76992a05d (a resync commit well before the merge-base), so main added/changed nothing here since branching. Nothing reads it: no vite.config exists at the repo root, no package.json script references it, and the two bin/verify_*.mjs hits resolve to storage/dist/sites/xgd/draft/index.html (generated site output), not the repo root. It was a checked-in duplicate of chromeHtml()'s output carrying a second hardcoded copy of the component scope - precisely the second definition site AC-960 forbids. The deletion is pinned by test_UAT_AC960_component_scope_is_written_in_exactly_one_place, which now asserts the enumeration property directly instead of naming the file."
    },
    {
      "risk": "OK",
      "file": "tools/generate/src/cli/webui.ts",
      "description": "Scope rename verified complete and consistent across the FULL tracked tree, not just the sparse checkout (2372 tracked files, only 476 materialized - a disk-only grep would have missed four files in five). git grep over HEAD: zero @gendevlabs hits outside .xgd/ anywhere in the tree; @lagrangefoundry appears only in tools/generate/src/cli/webui.ts:104 (the single declaration) and apps/control-app/src/builder/{app,editor}.js (the declared browser-source exception). The declaration file holds exactly one quoted scope literal, satisfying the no-LEGACY_SCOPE/no-fallback clause. .xgd/ retention of the old name is an explicitly declared exclusion. No unresolved conflict markers anywhere at HEAD; no renames, moved symbols, or reverted constants detected. tests/bug32-webui-scope-rebrand.test.ts (2/2), reconciliation-builder-workspace-origin and req115-builder-shell (21/21) all pass."
    }
  ]
}
