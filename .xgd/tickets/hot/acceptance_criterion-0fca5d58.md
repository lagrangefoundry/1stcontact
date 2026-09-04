---
uid: acceptance_criterion-0fca5d58
id: AC-1570
type: acceptance_criterion
title: Anything that is not this account's material is answered 'not found' on every
  route of this surface, so it is not an oracle for what exists
created_by: xgd
created_at: '2026-09-04T04:28:04.017519+00:00'
updated_at: '2026-09-04T04:28:04.017519+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

Every route of this surface that takes an identifier — reading one piece of material, fetching its
bytes, and correcting its description — answers *not found* for an identifier that does not name a
piece of the account's material.

The answer is identical whether the identifier names nothing at all or names a record of some other
kind held by the same account, such as a conversation or a generated report: both are *not found*,
and neither is *forbidden*. Nothing in the response, its status or its message distinguishes the two
cases, so the surface cannot be used to learn which identifiers exist.

An identifier omitted entirely is a separate, distinguishable refusal that says the identifier is
required — it is not conflated with *not found*.

## Verification

For each of the three identifier-taking routes, request an identifier that exists in the account but
names a conversation, and one that names nothing; assert both return the same not-found status and
that neither returns a forbidden status. Assert the two responses do not differ in a way that
reveals which case occurred. Assert the correction route does not modify the conversation. Request
each route with no identifier and assert a distinct refusal naming the missing identifier.
