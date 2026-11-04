---
uid: acceptance_criterion-a1042e70
id: AC-2254
type: acceptance_criterion
title: An account may hold several people, and provisioning makes all of them owners
  of its businesses
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:10:54.503614+00:00'
updated_at: '2026-11-04T17:10:54.503614+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An account may hold several people with no schema change. A second person is just
another person record naming the same account. The product creates one person per
account in v1 and offers nothing that adds a second, but when an account does
hold several people, provisioning a business for that account gives **every**
person on it an owner membership on the new business. None of them is left
unable to open a business their account pays for. Each person is admitted with
that business in their list.

## Verification

Invite a person, then add a second person to the same account directly (the
shape v1 does not build). Assert that the account's people are both persons.
Provision a business for the account and assert that the business's memberships
are exactly those two people, both in the owner role. Admit each person and
assert that the new business is in each one's list.
