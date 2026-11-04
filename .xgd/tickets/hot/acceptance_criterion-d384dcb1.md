---
uid: acceptance_criterion-d384dcb1
id: AC-2115
type: acceptance_criterion
title: Grants are read back by account key and the per-business capacity grant keeps
  its null subject; the invite writes no grant
created_by: xgd
created_at: '2026-11-01T09:54:38.052935+00:00'
updated_at: '2026-11-04T19:42:31.784511+00:00'
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
grant's subject. Grants are **read back by account key**: a grant whose subject
is an account's key is found under that account (and so listed for every person
on it), and a grant whose subject was written as anything else (a person's id,
for example) is not found under that person's account and confers nothing through
it. No column named for an account holds a business id, in the grant record or the
membership record, and the membership record has no account column at all.

The subject stays nullable, and null keeps its REQ-184 meaning: a per-business
capacity grant with no subject. Provisioning a business writes exactly this kind
of grant, so a business's plan belongs to the business and not to its inviter
personally. The invite writes no grant at all. Several grants against one
business, one naming no account and others naming different accounts, are stored
and read back apart.

**Not claimed.** REQ-194 says a non-null subject "names a real account". The
landed code does not enforce that on write: there is no foreign key, and
`openGrant` and `POST /api/grants` store any subject they are given. This is
recorded as a CODE-ISSUE intent gap in the story's Reconciliation Decisions. This
criterion asserts only the read-side behaviour above, and a mis-subjected grant
being stored is not evidence against it.

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
