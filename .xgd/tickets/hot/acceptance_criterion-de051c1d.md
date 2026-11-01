---
uid: acceptance_criterion-de051c1d
id: AC-2170
type: acceptance_criterion
title: Invites from two different businesses differ only in the business the row is
  held against, and the people schema carries no level
created_by: xgd
created_at: '2026-11-01T18:27:34.136408+00:00'
updated_at: '2026-11-01T18:57:27.614352+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The same invite control writes into whichever business the caller is in, with no
branch on which business that is (DOC-42 §3). An invite from the 1st Contact
business and an invite from a customer's business produce rows of the same shape,
differing only in the business (tenant) the row is held against. The stored people
record carries no level column to branch on. Read from the other side, a person
invited into a customer's business appears in that business's people list and not
in the 1st Contact business's.

## Verification

Invite one address as an owner of the 1st Contact business and another as an
owner of a customer business, with the same optional name. Read both rows back and
assert every column matches apart from identifiers, the address, timestamps and
the tenant. Read the people table's actual columns from the database and assert
none is a level. List people for each business and assert the customer's invitee
is listed in the customer's business only.