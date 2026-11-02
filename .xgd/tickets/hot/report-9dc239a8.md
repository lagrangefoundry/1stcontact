---
uid: report-9dc239a8
id: REPORT-7964
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:15:04.825404+00:00'
updated_at: '2026-11-02T00:15:04.825404+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `tests/test_UAT_FC_REQ-183_portal.workers.test.ts` — AA (both added), UAT test file. Both sides are identical except for two hunks, both about which helper creates the test account: HEAD uses the `inviteAccount` fixture (`tests/support/invite-account.ts`), and the incoming side uses `provisionInvite` from `apps/control-app/src/identity.ts`. Resolved to HEAD's version under the BUG-1301 PRECEDENCE rule. All 9 test functions are kept unchanged.

## Incoming changes preserved

Everything the incoming commit 5bbb4ef357 adds to this file (the whole REQ-183 portal suite and all its test bodies) is present. The only incoming hunks dropped are the import of `provisionInvite` and the three uses of it in the `invite()` helper.

They were dropped under the BUG-1301 exception. `provisionInvite` was deleted from production `identity.ts` on HEAD by REQ-186, which arrived via merge fa697853ad ("Merge branch 'xgd-working' into free-BUG-51"). That was a legitimate, documented model refactor, not churn. `tests/support/invite-account.ts` records why it was removed: it could only express a person who owns a business, so it could not express a member-level account (DOC-42 §1). The composite was moved into the test fixture as `inviteAccount`.

Keeping the incoming hunks would import a symbol that no longer exists. `inviteAccount` takes the same inputs (`email`, `accountName`, `endsAt`) and returns the same `user` and `businessId`, so no test body needed changing. As a result the resolved file nets to no diff against HEAD, because HEAD already carries this suite adapted to the fixture.

Not verified: the test file was not run.
