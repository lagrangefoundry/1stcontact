---
uid: acceptance_criterion-211aa877
id: AC-2256
type: acceptance_criterion
title: Provisioning refuses an account that does not exist or holds nobody, and the
  operator's account lookup answers with an account
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:10:57.798924+00:00'
updated_at: '2026-11-04T19:42:51.667030+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion

Provisioning a business refuses, before writing anything, an account key that
names no account ("No such account") and an account that exists but has nobody
on it ("nobody on it"). A business with no payer, or one nobody could open, is
never created.

The operator's add-a-business lookup takes an address and answers with the
**account** that the person reached through that address belongs to, not with
the person. The address matches regardless of case. An address nobody holds
answers with nothing. So the business the operator adds is owned by the account,
never by a person's id.

## Verification

Attempt to provision with a freshly minted account key that was never written,
and assert that it is refused as no such account. Write an account with no people
and attempt to provision for it. Assert that it is refused as having nobody on it,
and that no tenant with either attempted name exists afterwards. Invite an
address and provision a business for it, then look the account up by that
address in upper case. Assert that the answer's key is the person's account key
and differs from the person's id, and that looking up an unknown address answers
with nothing.