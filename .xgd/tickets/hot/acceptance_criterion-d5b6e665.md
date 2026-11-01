---
uid: acceptance_criterion-d5b6e665
id: AC-2165
type: acceptance_criterion
title: Owning the 1st Contact business is a memberships.role='owner' row, indistinguishable
  to a caller from owning any other business
created_by: xgd
created_at: '2026-11-01T17:59:05.666542+00:00'
updated_at: '2026-11-01T17:59:05.666542+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
Ownership of the 1st Contact business is expressed exactly as ownership of any customer's business: an active membership with role `owner` on that business. Given two people, one holding an `owner` membership on the 1st Contact business and one holding an `owner` membership on a customer business (e.g. a salon):
- each is reported as owner of their own business through the same observable answers (for example, `canInvite` true on that business's people listing), with no field, flag or route that differs between the two
- the 1st Contact owner additionally passes the add-a-business fulfilment gate, and that is only because the business they own is the one whose product is businesses. It is not because of anything else on their user record.
- holding the `platform_operator` column without an `owner` membership on the 1st Contact business does not make someone its owner.

## Verification
Seed an owner of the 1st Contact business and an owner of a salon, both by `owner` membership rows and neither with `platform_operator`. Assert that each is reported as owner of their own business in the same way. Assert that the 1st Contact owner's add-a-business request succeeds. Assert that a user with `platform_operator` and no membership is not reported as owner of the 1st Contact business.