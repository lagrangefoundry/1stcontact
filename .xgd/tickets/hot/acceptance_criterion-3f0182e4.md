---
uid: acceptance_criterion-3f0182e4
id: AC-1742
type: acceptance_criterion
title: Provisioning a business — not the invite — writes the business, its owner membership
  and grant together, and a starter site whose address cannot collide
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:29.920626+00:00'
updated_at: '2026-11-04T16:59:28.369828+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite creates no site and no business. Provisioning a business for an
existing account (by its account key, REQ-194) is what gives a person something
to edit. It writes:

- a **registered tenant** carrying the business's name, which the site storage
  will serve, and owned by that account;
- an **owner membership** joining the account's person to it and an **active
  grant** from an administrator source against it, written together, so no
  business exists that nobody may operate or that carries no access;
- exactly **one starter site**, with one page carrying the starter heading.

The starter site's published address is unique to that business by construction:
the published address is the site's own key (REQ-190), not its slug, so two
businesses provisioned the same way — whose starter sites share the same slug —
still carry different addresses and can never be refused for claiming the same
one. Provisioning a business with no owning account, or with an empty name, is
refused before anything is written.

(Note, REQ-190: the earlier wording that published addresses are claimed across
the whole platform by slug no longer holds — that table was removed.)

## Verification

Invite an address and assert no tenant, membership, grant or site exists for that
person's account. Provision a business for that account, then read the tenant,
membership and grant back from storage: assert the tenant is registered with the
given name and owned by the account, the membership is active in the owner role
and the grant is active with an administrator source. List the sites belonging to
the reported business: assert exactly one, whose starter page contains the
starter heading. Provision a second business the same way and assert the two
starter sites share a slug but carry different site keys. Attempt to provision
with an empty account and, separately, an empty name; assert each is refused and
no new tenant, membership or grant was stored.
