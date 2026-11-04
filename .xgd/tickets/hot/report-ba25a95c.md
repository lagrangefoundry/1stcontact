---
uid: report-ba25a95c
id: REPORT-10941
type: report
title: 'Report: fix_plan for report-3f77b790'
created_by: xgd
created_at: '2026-11-04T21:53:11.720271+00:00'
updated_at: '2026-11-04T21:53:11.720271+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-3f77b790
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - tests/reconciliation-identity-person-addresses-names.workers.test.ts::test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates
    dependency_tests:
    - tests/reconciliation-identity-accounts.workers.test.ts::test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value
    hypothesis: The AC-2257 runtime test seeds no contact in the customer business,
      and peopleOf lists only users WHERE tenant_id = business. Both people lists
      are empty, so ownerPeople.people[0].id at line 409 throws a TypeError before
      the record and status 403 checks run.
    instructions: 'The production gates already behave as AC-2257 claims: ownsBusiness
      reads role === owner (identity.ts:1232), canInvite, invite, record and status
      are gated on it, and the admin route is gated on ownsPlatformBusiness. The test
      was added today and has never passed because its fixture is incomplete. aCustomerOwner()
      and the staff member are platform-tenant users with memberships only, so owner.businessId
      holds no users rows. GET /api/people returns [] for both callers, the list-equality
      check is vacuous, and ownerPeople.people[0] is undefined. Fix the evidence,
      not the code: before the list comparison, have the owner put a real contact
      into owner.businessId through the product path (postInvite with the owner token,
      as the AC-2249 test above does). Assert both lists are non-empty and contain
      that contact, then use it as the target for the record and status refusals.
      Strengthen those two refusals by reading the target back and asserting its display
      name and status are unchanged. Keep every existing assertion, including the
      403s, the canInvite difference, the admin 404 for staff and the 400 for the
      operator. Do not change production code.'
    test_scope: test_UAT_AC2257_
    ladder:
      rung1: REQ-194 requires that no permission check reads role beyond the owner
        question, which is exactly what the test asserts. No later intent in scope
        contradicts it.
      rung2: At the reference, invite, record and status are gated on ownsBusiness
        and the admin route on ownsPlatformBusiness, both reading role === owner only
        (identity.ts:1232-1238, router.ts:1284-1299, 1450-1452, 1489-1491, 1563-1565).
        The code already matches the test intent.
      rung3: 'Decided here: the assertions stand and the fixture is fixed. The test
        seeds no contact in the business it lists, so it changes and the code does
        not. No override.'
---

# Fix Plan — Iteration 3

## Hypothesis
`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.

## Analysis
- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421 (orphaned) and the REQ-191/193/194 fixture migration. The last batch_fix_assessment (comment-c711e16f) left 33 tests green and reported `blocked_by: null`. There is no stuck report and no mode-rule block to rule on, so this is a first hypothesis for this test.
- **The failing test is brand new.** It was added at 13:42 today by `fix_reconciliation_review` (commit 60a403fb21) in `tests/reconciliation-identity-person-addresses-names.workers.test.ts:361` and has never passed. The JUnit XML is missing, so I couldn't read the error from the report. The sandbox also blocks running workerd here (`listen EPERM 127.0.0.1`), so the diagnosis comes from reading the code.
- **Root cause.** `peopleOf` (`apps/control-app/src/people.ts:337`) lists `users WHERE u.tenant_id = <business>`. `aCustomerOwner()` uses `inviteAccount`, which creates the owner as a `users` row in the PLATFORM tenant and only gives them a *membership* on the new business. `provisionBusiness` writes no `users` row in the business. The staff member is likewise a platform-tenant user with a membership. So `owner.businessId` holds zero people:
  - `expect(staffPeople.people.map(id)).toEqual(ownerPeople.people.map(id))` passes vacuously (`[] == []`). That is a weak observation.
  - `const target = ownerPeople.people[0].id` (line 409) throws `TypeError: Cannot read properties of undefined (reading 'id')`. The record and status 403 checks never run.
- **The rest of the test matches the code.**
  - `ownsBusiness` (`identity.ts:1232`) reads `role === 'owner'`.
  - invite, record and status are gated on `ownsBusiness`, and `canInvite` is `ownsBusiness` (`router.ts:1372`, `1452`, `1491`, `1565`).
  - `POST /api/admin/businesses` is gated on `ownsPlatformBusiness`: a non-owner gets 404 and the operator with `{}` gets 400 (`router.ts:1284-1307`).
  - The staff membership inserts match the `memberships` schema (`0001_baseline.sql:696`), and nothing else writes a (staff, owner-business) or (staff, PLATFORM) membership that could collide with `idx_memberships_user_business`.
- **Sibling test.** The sibling AC-2257 test in `reconciliation-identity-accounts.workers.test.ts:191` is a static scan plus a provisioning check. It's unaffected.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-identity-person-addresses-names.workers.test.ts::test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` — weak-observation — the "same list for owner and staff" equality is vacuous on an empty business. Assert the list is non-empty and contains the seeded contact before comparing.
- `tests/reconciliation-identity-person-addresses-names.workers.test.ts::test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` — weak-observation — the record and status 403s only check the status code. Also read the target's row back and assert the display name and status are unchanged, matching the `countPeople` before/after check the invite already has.

## Batches
One batch, one test, plus the sibling AC-2257 test as blast radius. The fix is confined to this test's fixture.

## Resolution ladder (REQ-938)
Batch 0 is decided at rung 3, with rungs 1 and 2 agreeing with the test's intent.
- **Rung 1.** REQ-194 says "no permission check anywhere reads `role`" and "no access restrictions" beyond `'owner'`. That is exactly what the test asserts, and no later intent in scope contradicts it.
- **Rung 2.** The reference state gates invite, record and status on `ownsBusiness` and the admin route on `ownsPlatformBusiness`, both of which read `role === 'owner'` only (`identity.ts:1232-1238`, `router.ts:1284-1299`, `1450-1452`, `1489-1491`, `1563-1565`). The code already behaves as the test claims.
- **Rung 3.** The test's assertions stand. Its fixture is incomplete (there is no contact in the business to list or target), so the test changes, not the code. No override is needed.
