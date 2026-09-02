---
uid: acceptance_criterion-2eedb758
id: AC-1488
type: acceptance_criterion
title: The same file is one stored object within an account and two separate objects
  across two accounts
created_by: xgd
created_at: '2026-09-02T00:17:15.580046+00:00'
updated_at: '2026-09-02T00:26:37.634964+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

Where attached bytes are stored is derived from the bytes themselves and from the account the store
handle is scoped to, with both consequences observable:

- **Dedup within an account.** Attaching identical bytes twice under one account yields the same
  content address on both attachment records and resolves to one stored object, not two copies.
- **Isolation across accounts.** Two handles scoped to two different accounts, attaching byte-for-byte
  identical content, yield records carrying the *same* content address and objects at two *different*
  absolute locations. Both objects exist independently; neither account's bytes are reached at the
  other's location, and removing or replacing one leaves the other untouched.

The account is never supplied to an attach operation — the location's account component comes from the
handle, so no caller can place bytes into another account's namespace, whether by mistake or by
choosing the address.

## Verification

Inside the deployment's runtime against a real object store: obtain two handles scoped to two
different accounts, attach the same byte sequence through each, and assert the two attachment records
carry the same content address while the two absolute locations differ and both hold an object.
Separately, attach the same bytes twice within one account and confirm the two records address one
stored object.