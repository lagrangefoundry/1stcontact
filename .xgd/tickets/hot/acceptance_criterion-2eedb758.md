---
uid: acceptance_criterion-2eedb758
id: AC-1488
type: acceptance_criterion
title: One record owns one stored object, and one account's bytes are unreachable
  from another's
created_by: xgd
created_at: '2026-09-02T00:17:15.580046+00:00'
updated_at: '2026-09-04T05:17:18.121229+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

Where attached bytes are stored is derived from the **attachment record that owns them** and from the
account the store handle is scoped to, with both consequences observable:

- **One record owns one stored object.** Each attachment record addresses a stored object of its own,
  under that record's own identifier inside the account's namespace. Attaching identical bytes twice
  within one account therefore yields two records carrying the *same* content digest and **two
  separate stored objects**, not one shared one — so removing the bytes belonging to one record
  cannot take away bytes another record still names.
- **Isolation across accounts.** Two handles scoped to two different accounts, attaching byte-for-byte
  identical content, yield records carrying the *same* content digest and objects at two *different*
  absolute locations. Both objects exist independently; neither account's bytes are reached at the
  other's location, and removing or replacing one leaves the other untouched.

The account is never supplied to an attach operation — the location's account component comes from the
handle, so no caller can place bytes into another account's namespace, whether by mistake or by
choosing the address. The content digest never determines the location, so no caller can reach
another record's bytes — in their own account or anyone else's — by presenting a digest.

## Verification

Inside the deployment's runtime against a real object store: obtain two handles scoped to two
different accounts, attach the same byte sequence through each, and assert the two attachment records
carry the same content digest while the two absolute locations differ and both hold an object.
Separately, attach the same bytes twice within one account and confirm the two records address two
distinct stored objects, both present.

Absolute locations are composed from the account and the attachment record's own identifier. A
location composed from the content digest must not be asserted anywhere: that was the previous
component's addressing, and re-pinning it is what made the bytes unreadable through the record.
