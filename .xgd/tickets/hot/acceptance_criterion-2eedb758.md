---
uid: acceptance_criterion-2eedb758
id: AC-1488
type: acceptance_criterion
title: 'Attached bytes are located by the record that names them within the account''s
  namespace: one record one object, and two accounts two unreachable objects'
created_by: xgd
created_at: '2026-09-02T00:17:15.580046+00:00'
updated_at: '2026-09-10T02:22:16.348384+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Where attached bytes are stored is derived from the attachment record that names them and from the
account the store handle is scoped to, with both consequences observable:

- **One record, one stored object — no dedup within an account.** Attaching byte-for-byte identical
  content twice under one account yields two attachment records carrying the *same* integrity digest
  and two *distinct* stored locations, both holding an object. The digest describes the bytes; it is
  not where they live, and identical bytes are not collapsed into a shared object.
- **Isolation across accounts.** Two handles scoped to two different accounts, attaching byte-for-byte
  identical content, yield records carrying the *same* integrity digest and objects at two *different*
  absolute locations. Both objects exist independently; neither account's bytes are reached at the
  other's location, and removing or replacing one leaves the other untouched.

The account is never supplied to an attach operation — the location's account component comes from the
handle, so no caller can place bytes into another account's namespace, whether by mistake or by
choosing the address.

## Verification

Inside the deployment's runtime against a real object store: obtain two handles scoped to two
different accounts, attach the same byte sequence through each, and assert the two attachment records
carry the same integrity digest while the two absolute locations differ and both hold an object.
Separately, attach the same bytes twice within one account and confirm the two records carry one
digest and address two distinct stored objects, both present.
