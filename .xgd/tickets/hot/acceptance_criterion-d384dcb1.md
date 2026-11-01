---
uid: acceptance_criterion-d384dcb1
id: AC-2115
type: acceptance_criterion
title: An entitlement names its business as object and optionally an account as subject;
  invite and business provisioning write grants naming no account
created_by: xgd
created_at: '2026-11-01T09:54:38.052935+00:00'
updated_at: '2026-11-01T10:22:21.213990+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

In the stored grant record, the column for the business holds a business
(tenant) id and is the grant's object; a separate, nullable column holds the
account the grant is for, its subject. No column named for an account holds a
business id, in the grant record or the membership record. Grants written by an
invite and by provisioning an additional business name a business and no
account. Grants already present before the change remain readable under the new
columns, with no account named. Several grants against one business, one naming
no account and others naming different accounts, are stored and read back apart.

## Verification

Apply the deployed migration sequence in order to a database already holding
grants and memberships, then read each table's actual columns from the database
and assert the business and subject columns exist as described. Assert the
pre-existing grant and membership are still readable with no account named.
Invite an address and provision a second business; assert both grants name
their business and no account. Write three grants against one business (none,
account A, account B) and assert each reads back distinctly.