---
uid: acceptance_criterion-dab80a56
id: AC-1482
type: acceptance_criterion
title: A deployment with nowhere to put attachment bytes is refused when the store
  is built, not at the first upload
created_by: xgd
created_at: '2026-09-01T23:58:01.852207+00:00'
updated_at: '2026-09-02T00:13:30.166523+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

A deployment whose client material would have nowhere to go is treated as misconfigured, and says so
when the store is built rather than when a file arrives.

- Obtaining a store fails when the deployment declares no place for attachment bytes.
- The failure happens **when the store is obtained**, before any operation is attempted — including
  operations that would never touch bytes. A deployment that could store a record but not the document it
  describes is not a partially working deployment; it is a broken one.
- The failure is a distinct, named error a program can branch on, in the same shape as the missing-account
  refusal: it states that attachment bytes have no home, names both places the declaration is required —
  the default configuration and the named production environment, which inherits nothing — and states that
  it must name storage of its own and never the storage the public site is served from.
- This refusal is this platform's own decision, and it is stricter than the underlying component's, which
  treats attachments as an optional capability and refuses them at first use. That component behaviour is
  correct for a general component and is not changed.

## Verification

Attempt to obtain a store with the attachment-byte storage undeclared and observe the attempt fails with
the named error, before any ticket operation is issued. Read the error message and confirm it names both
declaration sites and the storage it must not be pointed at.