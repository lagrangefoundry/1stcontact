---
uid: acceptance_criterion-969c91c0
id: AC-2341
type: acceptance_criterion
title: Accepting the terms for an admission holding nothing provisions the account's
  own business before recording acceptance, idempotently; a failed provisioning records
  no acceptance; re-accepting with a business already held provisions nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:09:47.537101+00:00'
updated_at: '2026-11-07T08:09:47.537101+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion

Accepting the terms is what gives a person who has signed up their own business. When
an admitted person whose admission holds **no business at all** posts a valid
acceptance, and their account owns no business, a business is provisioned for that
account **before** the acceptance is recorded. That business gets:
- the account the person already belongs to as its owner; no new account row is
  written;
- an owner membership for the person, and an active, open-ended grant (no end date);
- a starter site that is servable immediately;
- the person's current display name as its name, or the visibly provisional
  placeholder `Unnamed business` when they have none (or it is empty).

After that the acceptance is recorded and the request answers 204. Admission then
succeeds with that one business listed and selectable.

The provisioning is idempotent on business ownership:
- **Accepting again**, including after the current terms version changes, provisions
  nothing further. The account still owns exactly one business.
- **Holding any business already** means provisioning is skipped. A person whose
  admission already lists a business (for example, an operator re-accepting bumped
  terms) is given no business of their own, whoever owns the businesses they hold.
- **A failed provisioning records no acceptance.** The person stays unaccepted, is
  still admitted, is served the interstitial again, and can retry by accepting again.

## Verification

Add and invite a contact with a display name, then post a JSON acceptance as them.
Assert the response is 204 and that the account count is unchanged. Assert exactly one
business now names the contact's account as owner and carries the display name, with an
owner membership for the contact, an active grant with no end date, and a servable
starter site. Assert a fresh admission lists that business as selectable. Bump the
terms version and accept again, then assert the account still owns exactly one
business. Repeat for a contact with no name and assert the business is named
`Unnamed business`. Re-accept bumped terms as an operator whose admission holds the
1st Contact business, and assert no business is created. Make provisioning fail for a
contact holding nothing. Assert no acceptance is recorded, that admission still
succeeds, and that a navigation is answered with the terms again.
