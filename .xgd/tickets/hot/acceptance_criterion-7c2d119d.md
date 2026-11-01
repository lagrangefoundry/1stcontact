---
uid: acceptance_criterion-7c2d119d
id: AC-2200
type: acceptance_criterion
title: Opening or withdrawing a grant is the 1st Contact operator's act, refused 403
  to every other caller including the business's own owner; changing login status
  stays an owner act
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:16.672958+00:00'
updated_at: '2026-11-01T22:20:31.516886+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
Opening a grant and withdrawing a grant are **the 1st Contact operator's act**.
They are gated on the fulfilment-operator condition (`ownsPlatformBusiness`: the
caller owns the 1st Contact business, whose product is businesses), not on owning
the scoped business. Any other caller is refused with **403** and no grant row is
written or modified. That includes a member of the scoped business and that
business's own **owner**, because a surface that can grant itself access is not a
portal (REQ-183 §6), and a customer-reachable route onto a live `pro` grant is an
unbounded free-plan mint (REQ-180 D2). The operator performs both successfully.

The Contacts detail offers the **Withdraw** control only to a caller holding that
condition (`canFulfil`). A customer owner sees their grants with no Withdraw
control.

Changing a person's login status stays an owner act on the scoped business. A
caller who does not own the business they are scoped to is refused 403, and the
person's status is unchanged. An owner of the scoped business can change it.

## Verification
Against real D1, through the Worker with a verified Access token:
- As a non-owner member of a customer business, and then as that business's
  owner, attempt to open a `pro` grant on the business and to withdraw its
  existing grant. Assert 403 each time, that the grant count is unchanged, and
  that the existing grant is still `active`.
- As the 1st Contact operator, scoped to the 1st Contact business, open and then
  withdraw a grant on that business. Assert 200 for both, that the count grew by
  one, and that the withdrawn grant reads `revoked`.
- Separately, as a non-owner member, set a person's status and assert 403 with
  the status unchanged. As the owner, set it and assert 200 with `suspended`.
- In the jsdom panel, open a contact holding an active grant with `canFulfil`
  false, and assert that no Withdraw control is rendered.
