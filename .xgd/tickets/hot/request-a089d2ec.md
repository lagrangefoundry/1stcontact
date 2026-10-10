---
uid: request-a089d2ec
id: REQ-395
type: request
title: 'Platform operator: act as a delegate in any business it hosts, and claim reserved
  names for the platform'
created_by: EPIC-16
created_at: '2026-10-10T16:01:22.706601+00:00'
updated_at: '2026-10-10T16:14:27.708726+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-76b30c7f
  commits:
  - working_sha: bd339a1b1b37a863811a165adcdba1418e676bf1
    reconcile_sha: null
    main_sha: null
  - working_sha: d508815c8154b86a33bfaedfa7497db4f41cc9d5
    reconcile_sha: null
    main_sha: null
  version: 0.2.502
  story_points: 3
---

## What the operator wants

The platform operator (`users.platform_operator = 1`), inside a business it hosts but is not a member of, may do what a **delegate** of that business may do — starting with choosing its public address.

## Why

The operator already enters any business by its `/b/<id>/` address (`admissibleBusiness`, `identity.ts`: "the admin bypass's half"), but enters with `role: null`, so every route that asks "owner or delegate?" refuses it. On 2026-10-10, setting up `faelan.com` in production for its owner (`faelanwesthead@gmail.com`), the operator was refused at `POST /api/hostname/claim`:

> Only an owner or delegate of this business may choose its address.

The owner cannot do it either: the Access policy on `app.1stcontact.io` admits only the operator's own email (EPIC-16 §I10), so an invited customer is refused before the app sees them. Today the only way through is a hand-written `site_domains` row in production D1, as was done for `1stcontact.1stc.site`. That is the thing this ticket removes.

## Behaviour

- Every route that currently refuses with "Only an owner or delegate of this business may …" (`router.ts`: add contacts, triage mail, edit people, invite people, change its name, choose its address — enumerate them all, don't take this list as complete) admits the platform operator inside a business it entered through the admin bypass, exactly as it admits a delegate.
- Decided in ONE place — a predicate the routes share (e.g. "may act for this business": owner, delegate, or platform operator) — not by adding an operator clause to each route, so a route added later inherits it.
- Delegate-level, not owner-level. Anything today reserved to an owner alone (if any route distinguishes owner from delegate) stays owner-only; list which those are in this body.
- Every action taken this way is recorded as the operator's own user, never as the owner's. If the activity log records actor and role, the role reads as the operator (not `owner`, not `delegate`) so the record is honest about who acted and how.
- The business's own rules still apply: the operator choosing an address meets the same finality, one-per-business and reserved-name rules an owner does — with the one exception below.

## Folded in: reserved names for the platform business

`RESERVED_PLATFORM_IDENTITY` (`hostname.ts`: `1stcontact`, `1stc`, `support`, `billing`, …) exists to stop CUSTOMERS claiming platform-looking names. It currently stops the platform too: claiming `1stcontact.1stc.site` for the 1st Contact business was refused and had to be written to D1 by hand. The platform operator, claiming for the **platform business** (`PLATFORM_BUSINESS_NAME` / `TENANT_ID`), may claim a reserved label. A customer business may not, whoever is acting for it — the operator included. Infrastructure and protocol reservations (`RESERVED_INFRASTRUCTURE`, `RESERVED_PROTOCOL`) stay refused for everyone.

## Test plan

UATs (`test_UAT_FC_<id>_*`): the operator, not a member, claims an address for a customer business and it lands; the same request from a signed-in user with no membership is still refused; each other owner-or-delegate route admits the operator (one parametrised UAT over the enumerated list); an owner-only route (if any) still refuses the operator; the activity record names the operator as actor; the operator claims a reserved label for the platform business and it lands; the operator claiming a reserved label for a customer business is refused; nobody can claim an infrastructure or protocol label.

## What landed

**One predicate, one mark.** `resolveScope`'s hosting-bypass branch (the only reader of `platform_operator`) now returns the scope marked `entered: true`. `operatesBusiness(admission, scope)` — now taking the scope, not a bare id — answers true for an owner, a delegate, or an `entered` scope. Every owner-or-delegate gate already called `operatesBusiness`, so they all inherit it, and a route added later on that predicate does too. `enteredBusiness` (chrome banner + `operator.entered` audit) reads the same mark instead of re-deriving "not held".

**Routes now admitting the operator inside a business it entered** (every `operatesBusiness` gate in `router.ts`):
- `POST /api/people/add` — add a contact
- `POST /api/people/inbound/promote` — promote an inbound sender to a contact
- `POST /api/people/inbound/discard` and `/restore` — triage mail
- `POST /api/people/record` — edit a person
- `GET /api/people/invite` and `POST /api/people/invite` — invite copy / send invites
- `POST /api/business/name` — change its name
- `POST /api/hostname/claim` — choose its address
- `GET /api/people` reports `canInvite: true` to the operator.

**Still owner-only** (gated on `ownsBusiness`, which an entered scope's `role: null` never satisfies): `POST /api/people/delegate` (appoint a delegate) and `POST /api/people/delegate/revoke`; `GET /api/people` reports `canDelegate: false`. Also unchanged: domain writes on `/api/domain` (gated on being the account holder) and the platform-business-only console/fulfilment (`ownsPlatformBusiness`).

**Recording.** Actions are recorded under the operator's own user: the request log's `actor` is the admission's user id, which is the operator's. The log has no role column, so there is no role to set; `grantedBy` on invites/delegations is likewise the operator's own email.

**Reserved names.** `hostname.ts` adds `RESERVED_FOR_PLATFORM` (infrastructure + protocol only). `labelRefusal` / `checkHostname` / `claimHostname` take a `platformBusiness` flag (default false = the full customer list); the router's check and claim routes and the settings assistant's port (`businessSettings`) pass `isPlatformBusiness(env, scope.businessId)` — a new `identity.ts` predicate comparing to `TENANT_ID` (false, not a throw, where `TENANT_ID` is unset). Decided by the business, never by who is acting: the operator claiming for a customer business still gets the full reserved list. The flag is passed in rather than imported into `hostname.ts` because `identity → business → hostname` is a runtime import chain and importing back would make it a cycle.

## Supersessions (explicit)

This ticket reverses "the hosting operator is refused inside a business it entered" for delegate-level routes. Cases that pinned the old behaviour:
- REQ-367 `owner_controls_stay_shut_inside_an_entered_business` — rewritten: now asserts `canDelegate: false` and that appointing a delegate is refused (the v1 "cannot invite / add refused" half is withdrawn).
- REQ-186 `a_member_who_owns_nothing_here_is_refused_403`, REQ-199 `a_caller_who_does_not_own_the_business_may_not_add_to_it` and `..._may_not_read_its_invite_copy`, BUG-54 `someone_who_can_reach_a_business_but_does_not_own_it_is_refused_403` — removed; the behaviour they pinned is withdrawn, and the REQ-395 parametrised UAT covers those routes.

## UATs

`tests/test_UAT_FC_REQ-395_operator_acts_as_delegate.workers.test.ts` (workerd, real D1, real Access token):
- the operator chooses a customer business's address and it lands in `site_domains`; a signed-in non-member making the same request is refused 403 and nothing lands;
- every owner-or-delegate route admits the operator (parametrised over the list above);
- the People tab offers invite but not delegation; appoint/revoke delegate still refuse the operator;
- the request record names the operator as actor, never the owner;
- the operator checks and claims a platform-identity label for the platform business and it lands; every platform-identity label is reported `reserved` and refused 400 for a customer business;
- every infrastructure and protocol label is refused for both the platform and a customer business.