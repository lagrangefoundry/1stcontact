---
uid: acceptance_criterion-3f0182e4
id: AC-1742
type: acceptance_criterion
title: Provisioning a business writes the business (owned by the account), its owner
  membership and grant together, plus a starter site named unnamed addressed by its
  opaque key
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:29.920626+00:00'
updated_at: '2026-11-04T17:10:27.802223+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite creates no site and no business. What gives a person something to edit
is provisioning a business for an existing account, named by its account key
(REQ-194). Provisioning writes:

- a **registered tenant** carrying the business's name, which the site storage
  will serve, and which **names the account that owns it**;
- an **owner membership** for the account's people and an **active grant** from
  an administrator source, naming no account, both written together with the
  tenant, so no business exists that nobody may operate or that carries no access;
- exactly **one starter site**, named `unnamed`, with one page carrying the
  starter heading.

The starter site is addressed by its own opaque key (REQ-190), not by its name.
Two businesses provisioned the same way therefore have starter sites with the
same name but different keys, and so different published addresses. Neither can
be refused for claiming the other's address. Provisioning with an empty account
key or an empty name is refused before anything is written.

(Note, REQ-190: the earlier wording that published addresses are claimed across
the whole platform by slug no longer holds, because that table was removed. The
starter site's name moved from the business id to the fixed word `unnamed` for
the same reason.)

## Verification

Invite an address and assert that no tenant, membership, grant or site exists for
that person's account. Provision a business for that account, then read the
tenant, membership and grant back from storage. Assert:

- the tenant is registered with the given name and names that account as its
  owner;
- the membership is active in the owner role;
- the grant is active, with an administrator source and no subject.

List the sites belonging to the reported business and assert there is exactly
one, named `unnamed`, whose starter page contains the starter heading. Provision
a second business the same way and assert that the two starter sites share the
name but carry different site keys. Attempt to provision with an empty account
and, separately, with an empty name. Assert that each is refused and that no new
tenant, membership or grant was stored.
