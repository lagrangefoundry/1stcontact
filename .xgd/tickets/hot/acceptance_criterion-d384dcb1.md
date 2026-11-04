---
uid: acceptance_criterion-d384dcb1
id: AC-2115
type: acceptance_criterion
title: A non-null entitlement subject names an accounts key; the per-business capacity
  grant keeps its null subject and meaning, and the invite writes no grant
created_by: xgd
created_at: '2026-11-01T09:54:38.052935+00:00'
updated_at: '2026-11-04T17:10:24.791182+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

In the stored grant record, the column for the business holds a business
(tenant) id and is the grant's object. A separate, nullable column holds the
grant's subject. When that subject is present it is the key of a real account in
the accounts table (REQ-194), never a person's id and never an address. A grant
naming an account is found by that account's key, and a grant whose subject was
written as a person's id is not found under that person's account. No column
named for an account holds a business id, in the grant record or the membership
record, and the membership record has no account column at all.

The subject stays nullable, and null keeps its REQ-184 meaning: a per-business
capacity grant with no subject. Provisioning a business writes exactly this kind
of grant, so a business's plan belongs to the business and not to its inviter
personally. The invite writes no grant at all. Several grants against one
business, one naming no account and others naming different accounts, are stored
and read back apart.

(Note, REQ-190: the deployed migration sequence is now a single baseline that
seeds no grant and no membership, so the earlier clause about grants already
present before the column rename being readable afterwards has no rows to apply
to and is withdrawn.)

## Verification

Apply the baseline. Read each table's actual columns from the database and
assert that the business and subject columns exist as described, that the
subject column allows null, and that memberships have no account column. Invite
an address and assert no grant row was added. Provision a business for the
invited person's account and assert its grant names that business and no account.
Open a grant naming the account's key and assert the person's detail view lists
it among the grants for their account. Open one naming the person's id and assert
it is not listed. Create two accounts A and B, write three grants against one
business (none, account A, account B), and assert each reads back distinctly.
