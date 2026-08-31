---
uid: acceptance_criterion-a0ae39fd
id: AC-1387
type: acceptance_criterion
title: An unknown or inactive account is refused when the handle is asked for, never
  handed a store that reads nothing
created_by: xgd
created_at: '2026-08-31T09:47:25.602956+00:00'
updated_at: '2026-08-31T09:47:25.602956+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Asking for a store handle for an account that does not exist, or for an account that exists but is
not active, fails at that moment with a typed refusal that identifies the account and distinguishes
the two reasons in its message.

No handle is produced in either case. In particular, the caller never receives a working handle
that answers every question as though the account simply held no sites — that answer is
indistinguishable from a real, empty account, and it is the failure mode this refusal exists to
prevent.

An account that exists and is active yields a handle that reports which account it is bound to.

## Verification

Register one active account and one whose status is anything else. Ask for a handle for the
inactive one, and for a name never registered at all: each raises a refusal carrying the account's
identifier, and the two carry distinguishable messages ("no such account" versus "not active").
Ask for a handle for the active account and observe a usable handle that names that account.
Confirm no read is required after construction to discover the failure.
