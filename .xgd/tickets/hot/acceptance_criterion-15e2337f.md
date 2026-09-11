---
uid: acceptance_criterion-15e2337f
id: AC-1707
type: acceptance_criterion
title: A retrieval that brings back nothing usable — an error status, a redirect with
  no destination, an empty document — creates no material
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:56.765457+00:00'
updated_at: '2026-09-11T04:42:56.765457+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

A retrieval that reaches a permitted address but brings back nothing usable creates no material, and
says what happened in words a non-technical client can act on:

- the address answered with an error rather than a document: the refusal states the status the
  address answered with and that there was therefore nothing to store;
- the address redirected without saying where to: the refusal states that it redirected without a
  destination, naming the status;
- the address answered successfully but with an **empty** document: the refusal states there is
  nothing to store.

In all three cases the account's material is unchanged and there are no attached bytes left behind.

## Verification

Drive the retrieval against a controlled responder. Have it answer with a not-found status and
assert a refusal naming that status. Have it answer with a redirect carrying no destination and
assert a refusal saying so. Have it answer successfully with a zero-length body and assert a refusal
saying there is nothing to store. After each, assert the count of the account's material is the same
as before the attempt.
