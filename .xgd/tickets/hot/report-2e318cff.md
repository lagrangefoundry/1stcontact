---
uid: report-2e318cff
id: REPORT-7954
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:12:08.487738+00:00'
updated_at: '2026-11-02T00:12:08.487738+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

Incoming commit accd812ea4 ("Merge branch 'free-REQ-170' into xgd-working") was already cherry-picked onto this branch as 4ff806e457. Its diff matches accd812ea4 hunk for hunk (only line offsets differ) for every file except the REQ-161 test. HEAD has since built on that REQ-170 code (Contacts rename cb183be69c, two-axis contacts aacdc97d5a, the bundle-39edf66d reconcile review 7b03da96e5).

- apps/control-app/src/builder/api.js: UU code (2c). Kept HEAD; the incoming changes are already in HEAD via 4ff806e457 and later work.
- apps/control-app/src/builder/config.js: UU code (2c). Kept HEAD for the same reason. HEAD's TABS = [SITE_TAB, LIBRARY_TAB, PEOPLE_TAB].
- apps/control-app/src/builder/people.js: AA (2b). Kept HEAD; it is a superset of the incoming version (REQ-170 plus the Contacts and axes work).
- apps/control-app/src/people.ts: AA (2b). Kept HEAD; superset.
- apps/control-app/src/router.ts: UU code (2c). Kept HEAD; the incoming /people routes are already present via 4ff806e457.
- package.json: UU (2c). Kept HEAD; the incoming change is already applied.
- tests/support/d1-site-factory.ts: UU (2c). Kept HEAD; the incoming change is already applied.
- tests/test_UAT_FC_REQ-170_people.workers.test.ts: AA (2b/2f). Kept HEAD; superset, and no test function from either side is lost.
- tests/test_UAT_FC_REQ-161_library_tab.test.ts: DU (2a). Left it absent (git rm). This path has never existed in HEAD's history; main keeps this test as tests/reconciliation-library-tab.test.ts. To keep the incoming change, I applied its single hunk to that file (see below).

## Incoming changes preserved

- All code-file hunks from accd812ea4 are present in HEAD through the earlier identical cherry-pick 4ff806e457. The commit is redundant here (BUG-1109/BUG-1122 shape), not discarded.
- The one hunk not yet on main is the REQ-161 test change: it replaces the exact `toEqual([SITE_TAB.id, LIBRARY_TAB.id])` with an adjacency assertion, because the people tab was added. Main's copy (tests/reconciliation-library-tab.test.ts:229) still had the exact two-tab assertion, which contradicts HEAD's three-tab TABS. I applied the incoming hunk verbatim to that file and staged it.
- Spot-check: `npx vitest run tests/reconciliation-library-tab.test.ts` passed (1 file, 2 tests; no tests reported skipped).
- The staged diff against HEAD is that one 12-line test change.
- Note for orchestration: the branch history shows this SHA being retried repeatedly (attempt 13, many "recover .xgd state (BUG-603)" / "update bundle bundle-5052a63c" pairs). The bundle may need to record accd812ea4 as applied (4ff806e457) to stop re-picking it.
