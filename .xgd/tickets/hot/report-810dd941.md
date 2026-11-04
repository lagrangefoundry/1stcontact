---
uid: report-810dd941
id: REPORT-10942
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-04T21:58:05.377283+00:00'
updated_at: '2026-11-04T21:58:05.377283+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-3f77b790
  parent_report_uid: report-ba25a95c
  batch_index: '0'
---

I fixed `test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` by fixing the test's setup only; no production code changed. It now passes, along with the other 8 tests in `tests/reconciliation-identity-person-addresses-names.workers.test.ts`.

**Why it failed:** the customer owner's business held no contacts. So `GET /api/people` returned an empty list for both the owner and the staff member, the check that their lists match proved nothing, and `ownerPeople.people[0]` was `undefined`. The access checks themselves were already working as AC-2257 describes.

**What I changed in the test:**
- **A real contact first:** the owner now invites a contact ("Kept Name") into their business through the invite route. The test asserts the contact was created and saves its current status and name.
- **Stronger list check:** it now asserts the owner's list is not empty, that both the owner's and staff's lists contain that contact, and that the two lists are identical.
- **Stronger refusal checks:** the staff member's record-edit and status-change attempts now target that contact. After the 403s, the test reads the contact back from the database and asserts the name is still "Kept Name" and the status has not changed and is not `suspended`. So a gate that returned 403 but still wrote the change would fail the test.
- **Unchanged:** every original assertion stays, including the invite 403 with no new people, the `canInvite` difference, the owner's invite returning 200, the add-a-business route returning 404 for staff and 400 for the operator.

The acceptance criterion and the story already match how the code behaves, so I didn't update either.

The TypeScript check reports no errors in this file. I couldn't run the linter: `eslint` isn't installed locally, and the sandbox blocked downloading it from the npm registry.

```yaml
## Assessment
blocked_by: null
status: fixed
tests_fixed:
  - tests/reconciliation-identity-person-addresses-names.workers.test.ts::test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates
production_code_changed: false
upstream_changes: none
```