---
uid: acceptance_criterion-a816942d
id: AC-2176
type: acceptance_criterion
title: 'The DOC-42 §1 sequence runs: add, invite by id, provision a business, sign
  in, reach only that business and its /account'
created_by: xgd
created_at: '2026-11-01T18:27:58.001313+00:00'
updated_at: '2026-11-07T07:42:31.184812+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Adding a contact, inviting them, and provisioning a business compose into a working
customer. An owner of the 1st Contact business adds a new address
(`POST /api/people/add`), invites the resulting contact by id
(`POST /api/people/invite`), then provisions a business for that person's account.
The person signs in, accepts the current terms, and is admitted with exactly one
business — the one provisioned for them (accepting terms does not provision a
second, because the account already owns one) — reaches their own account portal
at `/account`, and is answered not-found by the business-provisioning route.

> Rewritten in fix-plan iteration 7 of story-7b1025b8: REQ-199 (in scope) moved
> address entry to the add route and made the invite take contact ids; REQ-203 (in
> scope) made accepting terms provision a business only for an account owning none.

## Verification

Through the routes, as an owner of the 1st Contact business, add an address, invite
the returned contact id, and provision a business for the reported person's
account. Sign in as that address with a valid proven identity and accept the
current terms. Assert admission lists exactly one business, the provisioned one,
and that it is selectable; request `/account` and assert it succeeds; request the
business-provisioning route and assert 404.
