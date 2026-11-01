---
uid: comment-c3af7596
id: COMMENT-6128
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-01T10:02:55.890958+00:00'
updated_at: '2026-11-01T10:02:55.890958+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-14c6540f
  kind: note
---

I filed the fix plan as **REPORT-7548** (`report-14c6540f`). It's one batch covering all 24 failing tests, and the 12 orphan ACs should clear once those tests pass. While filing, `xgd` tried to reach `github.com:22` and the sandbox blocked it. The report was still created locally, but if that call was a push or sync, it didn't happen.

**Root cause:** the tests use old names; the code is fine. Both test files still use names that later intents changed:
- `tests/reconciliation-identity-invite-and-admission.workers.test.ts`
- `tests/reconciliation-identity-multi-business-admission.workers.test.ts`

REQ-168 and REQ-184 renamed `accountId` to `businessId` in what `provisionInvite` and `provisionBusiness` return, and on each admitted business. They also renamed `memberships.account_id` and `entitlements.account_id` to `business_id` (migration `0006_entitlement_subject.sql`, lines 33, 46 and 71). Because the tests still read `.accountId`, every value they pass to the database is `undefined`, which produces the D1 type error. The two assertion failures (`expected 1 to be 2` and `expected null to be undefined`) come from the same thing. The current code and the reference version `reconcile-src-BUNDLE-35` agree with each other.

**What the batch tells the builder:**
- Rename `accountId`/`account_id` to `businessId`/`business_id` in both test files. Production code is frozen in reconcile mode and needs no change, so no override is needed.
- Six ACs have a test in both files: AC1740, AC1748 and AC1750–AC1753. Where the older single-business test contradicts the newer multi-business one, the newer one wins: REQ-178 says a lapsed business stays listed but can't be selected. The builder may retire the older duplicate as long as the AC is still covered.
- There are two AC1760 tests, and only the one that predates the terms-acceptance check fails. If renaming doesn't fix it, it should be retired in favour of the passing terms-aware test, not weakened.
- The 14 currently passing tests in these files must stay green.

**Ladder:** the decision was made at rung 1, because REQ-168, REQ-184 and REQ-178 come after this story's original wording. The reference version confirms it at rung 2. I made no AC changes.

**Weak-evidence flags** (they don't block this batch):
- The passing AC1746 test inserts grants keyed only by `account_id`, so it never exercises business-scoped grants.
- The two files duplicate their helpers and cover the same ACs.
- The AC2078 test counts rows across whole tables, so it could break if another test writes at the same time.
