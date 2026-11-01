---
uid: acceptance_criterion-3f0182e4
id: AC-1742
type: acceptance_criterion
title: Provisioning a business — not the invite — writes the business, its owner membership
  and grant together, and a starter site whose address cannot collide
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:29.920626+00:00'
updated_at: '2026-11-01T18:26:44.458022+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite creates no site and no business. Provisioning a business for an
existing account is what gives a person something to edit. It writes:

- a **registered tenant** carrying the business's name, which the site storage
  will serve;
- an **owner membership** joining the account to it and an **active grant** from
  an administrator source against it, written together, so no business exists that
  nobody may operate or that carries no access;
- exactly **one starter site**, with one page carrying the starter heading.

The starter site's published address is unique to that business by construction:
published addresses are claimed across the whole platform, so two businesses
provisioned the same way can never be refused for claiming the same address.
Provisioning a business with no owning account, or with an empty name, is refused
before anything is written.

## Verification

Invite an address and assert no tenant, membership, grant or site exists for that
person. Provision a business for them, then read the tenant, membership and grant
back from storage: assert the tenant is registered with the given name, the
membership is active in the owner role and the grant is active with an
administrator source. List the sites belonging to the reported business: assert
exactly one, whose starter page contains the starter heading. Provision a second
business and assert the two starter sites carry different published addresses.
Attempt to provision with an empty owner and, separately, an empty name; assert
each is refused and no new tenant, membership or grant was stored.
