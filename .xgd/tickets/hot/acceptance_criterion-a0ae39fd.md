---
uid: acceptance_criterion-a0ae39fd
id: AC-1387
type: acceptance_criterion
title: An unknown or inactive account is refused when the handle is asked for, never
  handed a store that reads nothing
created_by: xgd
created_at: '2026-08-31T09:47:25.602956+00:00'
updated_at: '2026-08-31T16:37:17.550689+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Asking for a store handle for an account that does not exist, or for an account that exists but is
not active, fails at that moment with a typed refusal that identifies the account and states which
of the two refusals it is.

**The reason is a value, not only prose.** The refusal carries the two cases as a discriminant a
caller can branch on — one meaning *no such account is registered*, the other meaning *this account
is registered and is not active*. A caller may not be asked to read the message text to tell them
apart, because the two license opposite responses: a caller that owns the deployment's own
configuration may legitimately resolve *not registered* by registering the one account its
configuration names, and may never resolve *not active*, which is a decision somebody made and
which retrying must not undo.

That distinction has to be checked explicitly by anyone acting on it. Registering an account is
idempotent on its identifier, so a deactivated account survives a blind re-register and the retry
would appear to work — a guarantee that holds only by accident of how registration is written is
not a guarantee.

No handle is produced in either case. In particular, the caller never receives a working handle
that answers every question as though the account simply held no sites — that answer is
indistinguishable from a real, empty account, and it is the failure mode this refusal exists to
prevent.

An account that exists and is active yields a handle that reports which account it is bound to.

## Verification

Register one active account and one whose status is anything else. Ask for a handle for the
inactive one, and for a name never registered at all: each raises a typed refusal carrying the
account's identifier, each carries a distinguishable message ("no such account" versus "not
active"), and each carries a reason value that a caller can compare without parsing the message —
the two reason values differ, and the one for a never-registered account is the one that licenses
registration.

Ask for a handle for the active account and observe a usable handle that names that account.
Confirm no read is required after construction to discover the failure.
