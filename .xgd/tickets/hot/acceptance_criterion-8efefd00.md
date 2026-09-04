---
uid: acceptance_criterion-8efefd00
id: AC-1592
type: acceptance_criterion
title: A newly provisioned account has exactly one starter site to edit, at an address
  that cannot collide with another account's
created_by: xgd
created_at: '2026-09-04T05:52:21.432330+00:00'
updated_at: '2026-09-04T05:52:21.432330+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

A newly provisioned account holds exactly one site, containing a home page carrying the
starter heading, so that the invited person arriving for the first time finds something to
edit rather than an empty account and a create-site flow that does not exist.

The site's published address is unique to the account by construction: two accounts
provisioned by two invitations never receive the same address, so the second account to
publish is never refused an address for a reason its owner could do nothing about. The
operation reports the address it created.

## Verification

Provision two accounts by invitation. For each, list the sites belonging to that account
and assert there is exactly one, that it is the address the operation reported, and that
its home page contains the starter heading. Assert the two accounts' addresses differ.
