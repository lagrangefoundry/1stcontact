---
uid: acceptance_criterion-84cb722b
id: AC-2173
type: acceptance_criterion
title: The invite writes no membership and no grant; an invitee who has not signed
  up and owns no business is admitted with nothing, not refused
created_by: xgd
created_at: '2026-11-01T18:27:45.291361+00:00'
updated_at: '2026-11-07T08:09:51.082731+00:00'
completed_at: null
last_field_updated: status
status: superseded
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
  superseded_by_uid: bundle-7988e925
---

## Criterion

The invite makes no business-running relationship and grants nothing a business
provides: adding a contact and inviting them write no membership row and no
entitlement row. A person invited into the 1st Contact business who has not signed
up (`member_since` is null) and whose account owns no business is **admitted with
an empty business set** rather than refused — the admission opens no route, because
the terms gate runs next and refuses everything but the terms interstitial and the
accept route ([[REQ-203]]). Provisioning a business for them afterwards admits them
with that business listed, without a second person being created. A person whose
account already owns a business but who holds no live membership (withdrawn, or
rows lost) is still refused, with the missing membership recorded as the reason.

> Rewritten in fix-plan iteration 7 of story-7b1025b8: REQ-203 (in scope, later than
> REQ-186) supersedes "an invited person holding no business is refused as
> no_membership"; reference `apps/control-app/src/identity.ts` `admit`
> (`signingUp` branch) at `reconcile-src-BUNDLE-38`.

## Verification

Count membership and entitlement rows, add a new address to the 1st Contact
business and invite it by id, and assert both counts are unchanged. Attempt
admission for that address and assert it succeeds with an empty business set.
Provision a business for the person, attempt admission again and assert it
succeeds listing exactly that business; assert exactly one person holds the
address. Withdraw that person's membership and assert admission is refused with
`no_membership` as the recorded reason.