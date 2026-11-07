---
uid: acceptance_criterion-e85ba84b
id: AC-2340
type: acceptance_criterion
title: A contact who has not signed up and whose account owns no business is admitted
  with no businesses and reaches only the terms interstitial; a withdrawn or lost
  membership on an account that owns a business is still refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:09:42.713503+00:00'
updated_at: '2026-11-07T08:19:51.872831+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A contact who holds no business-running relationship but has not yet signed up is
**admitted**, not refused. The admission carries an empty business set. Adding and
inviting a contact write no membership row and no entitlement row, so a freshly
invited contact holds nothing. When that contact signs in and has not accepted the
terms (no acceptance recorded) and their account owns no business, admission succeeds
with no businesses listed. Nothing in this decision reads the pipeline stage, so a Lead
who was never invited is treated the same way.

The admission opens no route. The terms gate runs next and refuses such a session
everything except the terms interstitial and the accept route. A navigation is answered
with the terms, and every asset and API request is refused 403.

The old refusal survives where it is still true. Admission still refuses with
`no_membership`, rendered as the single refusal message, when:
- the account already owns a business but the person holds no live membership on any
  business (the membership was withdrawn or expired, or the rows were lost); or
- the person has already accepted the terms and still holds nothing.

Re-inviting such a person is still the repair.

## Verification

Count membership and entitlement rows, add a new address and invite it by id, and
assert both counts are unchanged. Sign in as that address (terms not accepted) and
assert admission succeeds with an empty business set. Through the Worker, assert a
builder navigation is answered with the terms interstitial, and a builder asset and an
API route are each refused 403. Repeat with a Lead who was never invited and assert the
same outcome. Provision a business for an account, withdraw its only person's
membership, and assert admission is refused with `no_membership` as the recorded
reason. Record terms acceptance for a person holding nothing whose account owns no
business, and assert admission is refused with `no_membership`.