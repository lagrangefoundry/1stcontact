---
uid: acceptance_criterion-a816942d
id: AC-2176
type: acceptance_criterion
title: 'The DOC-42 §1 sequence runs: invite, provision a business, sign in, reach
  only that business and its /account'
created_by: xgd
created_at: '2026-11-01T18:27:58.001313+00:00'
updated_at: '2026-11-01T18:57:26.166569+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite and business provisioning compose into a working customer. An owner of
the 1st Contact business invites a new address, then provisions a business for that
person. The person signs in, accepts the current terms, and is admitted with
exactly one business — the one provisioned for them — reaches their own account
portal at `/account`, and is answered not-found by the business-provisioning
route.

## Verification

Through the routes, invite an address as an owner of the 1st Contact business and
provision a business for the reported person. Sign in as that address with a
valid proven identity and accept the current terms. Assert admission lists exactly
one business, the provisioned one, and that it is selectable; request `/account`
and assert it succeeds; request the business-provisioning route and assert 404.