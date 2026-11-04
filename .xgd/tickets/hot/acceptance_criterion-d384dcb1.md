---
uid: acceptance_criterion-d384dcb1
id: AC-2115
type: acceptance_criterion
title: An entitlement names its business as object and optionally an account as subject;
  business provisioning writes grants naming no account and the invite writes none
created_by: xgd
created_at: '2026-11-01T09:54:38.052935+00:00'
updated_at: '2026-11-04T16:59:22.780792+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

In the stored grant record, the column for the business holds a business
(tenant) id and is the grant's object; a separate, nullable column holds the
account the grant is for, its subject — an account key (REQ-194), never a
person's id and never an address. No column named for an account holds a
business id, in the grant record or the membership record; the membership record
carries no account column at all. Grants written by provisioning a business name
a business and no account; the invite writes no grant at all. Several grants
against one business, one naming no account and others naming different
accounts, are stored and read back apart.

(Note, REQ-190: the deployed migration sequence is now a single baseline that
seeds no grant and no membership, so the earlier clause about grants already
present before the column rename being readable afterwards has no rows to apply
to and is withdrawn.)

## Verification

Apply the baseline, then read each table's actual columns from the database and
assert the business and subject columns exist as described and that memberships
carry no account column. Assert no grant's account column matches a business id.
Invite an address and assert no grant row was added. Provision a business for the
invited person's account and assert its grant names that business and no
account. Create two accounts A and B and write three grants against one business
(none, account A, account B); assert each reads back distinctly.
