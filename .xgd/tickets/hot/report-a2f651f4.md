---
uid: report-a2f651f4
id: REPORT-8052
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:44:17.956990+00:00'
updated_at: '2026-11-02T00:44:17.956990+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- apps/control-app/src/builder/people.js — code (2c), resolved to HEAD (redundant commit; superseded hunks dropped per BUG-1301)
- apps/control-app/src/people.ts — code (2c), resolved to HEAD (redundant; superseded comment/import hunks dropped per BUG-1301)
- apps/control-app/src/router.ts — code (2c), resolved to HEAD. The auto-merge had placed a second copy of the `POST /api/people/record` handler outside the conflict markers; taking HEAD removes that duplicate. HEAD's `InvalidGrantError` handler (REQ-170) is kept.
- package.json — config scalar (2g), kept HEAD's version 0.2.81 rather than the incoming 0.2.79, which would move the version backwards
- tests/test_UAT_FC_BUG-54_person_record.test.ts — AA/UAT (2b/2f), resolved to HEAD; every test function is present on both sides

Net staged diff vs HEAD: empty. The commit is redundant (BUG-1109/BUG-1122 shape); finalize should detect this and skip it.

## Incoming changes preserved

The incoming commit 48a83cbabb ("Merge branch 'free-BUG-54' into xgd-working") was already integrated into HEAD as 2dcf9641b9 (the same merge, cherry-picked earlier). Checked against the incoming tip 48a83cbabb^2:
- builder/api.js (savePersonRecord), builder/email-shape.js, tsconfig.json, and tests/test_UAT_FC_BUG-54_person_record.workers.test.ts are identical in HEAD.
- router.ts: the POST /api/people/record route, the ownsBusiness gate, and the person_record_refused log are present in HEAD. people.ts: setPersonRecord is present.
- builder/people.js and test_UAT_FC_BUG-54_person_record.test.ts differ from the incoming version only in the `state` field (people-state.js / stateOf). The later free-coded commit aacdc97d5a ("feat(people): a contact sits on two axes, and the pipeline starts at Lead", REQ-188 / DOC-44 §3) deliberately replaced that field with the `stage`/`access` axes (people-axes.js). That is a documented, legitimate refactor already integrated into HEAD, so the obsolete `state` hunks were dropped under BUG-1301 PRECEDENCE. No test functions were removed; only the LOCKED field list differs, and HEAD's version reflects the refactor.

Flag for post-merge review: none needed beyond the confirmation above.
