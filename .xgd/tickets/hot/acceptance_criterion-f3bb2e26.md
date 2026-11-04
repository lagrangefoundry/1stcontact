---
uid: acceptance_criterion-f3bb2e26
id: AC-2323
type: acceptance_criterion
title: Add-a-business resolves the account email only among 1st Contact people, while
  Provision a business is offered in every business the operator scopes into
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-11-04T21:39:42.506983+00:00'
updated_at: '2026-11-04T21:39:42.506983+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
Add-a-business resolves the `accountEmail` it is given only among the people of
the 1st Contact (platform) business — never in the business the operator is
currently scoped to. The fulfilment privilege (`canFulfil`) is a property of the
caller (owner of the 1st Contact business), not of the scoped business, so the
Contacts "Provision a business" control is offered in ANY business the operator
has scoped into and submits that contact's own address. Outside the 1st Contact
business this means:
- a contact whose address no 1st Contact person holds gets HTTP 404 with
  `{"error": "No account with that email address."}`, and no business is created;
- a contact whose address a 1st Contact person also holds (per REQ-191 that is a
  different, unrelated person) gets a business provisioned for the 1st Contact
  person's account, not for the contact's own account.

This is current behaviour, recorded as a known defect (CODE-ISSUE) rather than
the intended design: see the story's Reconciliation Decisions.

## Verification
Seed a 1st Contact owner who also owns a customer business, and scope into that
customer business: assert `GET /api/people` there reports `canFulfil: true`.
Invite into the customer business a contact at an address no 1st Contact person
holds; submit add-a-business with it and assert 404 with the exact error body and
no business owned by that contact's account. Seed a 1st Contact person at
address A and a contact in the customer business at the same address A; submit
add-a-business with A and assert 200 and that the new business's
`owner_account_id` is the 1st Contact person's account, not the contact's.
