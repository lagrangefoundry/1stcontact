---
uid: acceptance_criterion-4fb92916
id: AC-2253
type: acceptance_criterion
title: An invite mints an account with an opaque acct_ key alongside the person, and
  a person with no account is refused by the schema
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:10:53.023885+00:00'
updated_at: '2026-11-04T17:18:32.998094+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Inviting an address that no person in the business yet holds creates an account
alongside the person, written with them. The account's key is opaque and carries
the account prefix (`acct_` followed by opaque hex). The account belongs to the
business it is an account *of*, is active, and holds exactly that one person. The
break-glass operator seed likewise gives a newly created operator an account of
their own.

Every person names an account. The storage itself refuses a person written
without one, or written against an account key that does not exist, so no person
can exist that belongs to no account.

## Verification

Invite a fresh address. Assert that the result reports `created`, that the
person's account key matches `acct_` followed by 32 hex characters, that reading
the account back shows the inviting business as its tenant and an active status,
and that the account's people are exactly the invited person. Then write a person
row directly with no account and, separately, with an account key that names no
account. Assert that the database refuses each.