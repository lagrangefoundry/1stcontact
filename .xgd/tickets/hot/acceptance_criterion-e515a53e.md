---
uid: acceptance_criterion-e515a53e
id: AC-2112
type: acceptance_criterion
title: A person whose every business has lapsed is admitted with every business listed
  and none selectable; grant expiry is evaluated from both sides
created_by: xgd
created_at: '2026-11-01T09:54:33.803545+00:00'
updated_at: '2026-11-01T10:22:21.851846+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Membership admits; entitlement does not. A person holding a live membership is
admitted even when no business they hold has a covering grant: every business
is listed and none is selectable. The person is refused only when no live
membership remains. A grant's end date is evaluated at admission from both
sides: a business whose grant has not yet ended is selectable and reports that
grant, and the same business becomes unselectable, reporting no grant, once that
end has passed. An open-ended grant does not expire.

## Verification

Invite an address with a grant ending in the future and assert admission
succeeds with that business selectable. Move that grant's end into the past and,
with nothing else changed, attempt admission again: assert it still succeeds,
with the business listed, unselectable and carrying no grant. Repeat with two
businesses, both lapsed, so the check cannot pass on code that stops at the
first: admission succeeds, both are listed, neither is selectable. Both date
directions are required; one alone would pass against code that always denied
or never evaluated the date.