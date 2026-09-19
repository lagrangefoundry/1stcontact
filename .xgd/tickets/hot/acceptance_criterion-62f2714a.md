---
uid: acceptance_criterion-62f2714a
id: AC-1829
type: acceptance_criterion
title: Binding reference storage to an unknown or inactive account is refused at binding
  time, distinguishing which
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:31.709087+00:00'
updated_at: '2026-09-19T13:37:31.709087+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Binding the deployment's reference storage to an account is refused at the moment
of binding — before any bundle handle exists — when that account is unknown or
not active:

- an **unknown** account is refused with the same error kind site storage raises
  for the same condition, so a caller catching "unknown account" need not know
  which store turned it away, and the message says no such account was found;
- an **inactive** account is refused with a message saying it is not active, and
  the refusal reports *inactive* as its reason rather than *unknown* — the
  distinction is load-bearing, because unknown is a state the owner of the
  configuration may resolve by registering, and inactive is a decision no caller
  undoes by retrying.

Deferring the check to the first read is not acceptable, because a deferred
refusal reads as an empty bundle. The operator's own backing has no account to
check: it serves one operator and has no binding step at all.

## Verification

Inside the deployed runtime, against the real registry: bind the store for an
account that was never registered and assert the rejection is of the shared
unknown-account error kind with a "no such account" message; register an account
in a suspended state, bind for it, and assert the rejection says it is not active
and reports its reason as inactive.
