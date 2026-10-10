---
uid: request-a089d2ec
id: REQ-395
type: request
title: 'Platform operator: act as a delegate in any business it hosts, and claim reserved
  names for the platform'
created_by: EPIC-16
created_at: '2026-10-10T16:01:22.706601+00:00'
updated_at: '2026-10-10T16:01:22.706601+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
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
