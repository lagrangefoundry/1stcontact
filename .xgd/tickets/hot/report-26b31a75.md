---
uid: report-26b31a75
id: REPORT-7763
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:59:35.558225+00:00'
updated_at: '2026-11-01T15:59:35.558225+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `apps/control-app/src/router.ts` — UU, code file (2c). The two sides' changes did not overlap. HEAD added imports (`fidelityDeps`, `adoptCapture`, `BrowserLauncher`, `HostDeps`, `r2ReferenceStore`) and incoming added the `./people` import block (`openGrant`, `peopleOf`, `personDetail`, `revokeGrant`, `setPersonStatus`). Both sets are kept, and the REQ-170 people routes applied cleanly.
- `tests/test_UAT_FC_REQ-161_library_tab.test.ts` — DU, kept HEAD's deletion (2a / BUG-1301 precedence). HEAD moved this suite into `tests/reconciliation-library-tab.test.ts` (commits 164ebaaa44 / 4f1097e95b, fix_quality_batch workflow). The incoming hunk only changed the old file's tab-list assertion (from the exact list `[SITE, LIBRARY]` to an adjacency check), so its target no longer exists at this path.
- Every other path is left exactly as in HEAD. The previous attempt's out-of-scope edit to `tests/reconciliation-library-tab.test.ts` was restored to HEAD with `git checkout HEAD --`.

## Incoming changes preserved

- router.ts: all lines added by accd812e (people imports and people/grant routes) are in the resolved file. Where the file differs from accd812e, the difference is HEAD's own later `chatHost` signature, which accd812e only shows as unchanged context.
- REQ-161 library tab UAT: the hunk was dropped under BUG-1301 because its target file was moved into the reconciliation suite on HEAD.

## Flag for post-merge review

`tests/reconciliation-library-tab.test.ts:229` still asserts `toEqual([SITE_TAB.id, LIBRARY_TAB.id])`, but with this commit `TABS` becomes `[SITE_TAB, LIBRARY_TAB, PEOPLE_TAB]`. That assertion will fail once this commit lands. The fix is the adjacency check REQ-170 wrote: keep the requirement that Library sits immediately after Site, without pinning the total tab count. It must go in as a separate change, not under this commit.
