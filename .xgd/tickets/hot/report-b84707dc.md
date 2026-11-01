---
uid: report-b84707dc
id: REPORT-7761
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:57:50.812029+00:00'
updated_at: '2026-11-01T15:57:50.812029+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `apps/control-app/src/router.ts`: UU, code file (2c). The only conflict was in the import block, and the two sides' changes did not overlap. I kept both. From HEAD (REQ-185): imports of `fidelityDeps`, `adoptCapture`, `BrowserLauncher`, `HostDeps` and `r2ReferenceStore`. From incoming (REQ-170): `openGrant`, `peopleOf`, `personDetail`, `revokeGrant` and `setPersonStatus` from `./people`. The file body uses both sets of imports.
- `tests/test_UAT_FC_REQ-161_library_tab.test.ts`: DU, UAT test (2a). I kept HEAD's deletion with `git rm`. Under the BUG-1301 precedence rule, the file is absent on the reconcile branch because the reconcile UAT generation workflow replaced it with `tests/reconciliation-library-tab.test.ts` (a639aeafd9, `xgd-kind: reconcile`, bundle-87be4669, story-1500b111). That replacement is a legitimate, documented workflow step, not LLM churn.
- `tests/reconciliation-library-tab.test.ts`: not itself conflicted, but I edited it. I applied the incoming hunk to this successor file (see below).

## Incoming changes preserved

- `router.ts`: all of the incoming `./people` imports are present, and the incoming route handlers that call `peopleOf` and `openGrant` are intact. The rest of the incoming change set (`people.ts`, `builder/people.js`, `config.js` `PEOPLE_TAB`, migration 0008, the REQ-170 test) applied cleanly and is staged. The migration number 0008 does not collide with HEAD, which stops at 0007.
- The REQ-161 test: the incoming hunk changed one assertion. It replaced the exact `toEqual([SITE_TAB.id, LIBRARY_TAB.id])` check with a check that Library sits immediately after Site, because REQ-170 adds a third tab, `PEOPLE_TAB`. The deleted file was the hunk's original target, and the successor `tests/reconciliation-library-tab.test.ts:229` carried the same exact-list assertion, which would fail with three tabs. I moved the incoming change onto that line, so the intent is preserved rather than dropped. The edited test file passes when run on its own (1 file, 2 tests).

## Post-merge review flag

The enrichment rule asked for both files to be flagged for post-merge review because intent was unknown on one or both sides. Things to check:
- `router.ts`: the import union.
- `reconciliation-library-tab.test.ts`: the assertion moved over from the deleted REQ-161 test.
