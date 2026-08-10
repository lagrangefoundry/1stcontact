---
uid: acceptance_criterion-c595b0f5
id: AC-1074
type: acceptance_criterion
title: 'An operation can be declared in full and still be withheld from a consumer:
  it is not offered, not documented to it, and refused as a capability decision if
  called'
created_by: xgd
created_at: '2026-08-10T09:06:08.116796+00:00'
updated_at: '2026-08-10T09:06:08.116796+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

The declaration and the grant are separate, so an operation can be fully declared,
documented and schema-checked while a given consumer cannot reach it. For the
builder's assistant today, managing image and font files and publishing are
declared but not granted: neither is among the operations offered to it, neither
appears in what it is told about the surface (nor does the title of a group it was
not granted), and calling one anyway is refused as a capability decision — the
site is byte-unchanged and the refusal is recorded as a capability refusal naming
the operation, rather than vanishing as an unknown name with nothing to audit.

## Verification

Assert the declaration names the withheld operations. Build the assistant's
surface and assert those operations are absent from what it offers and absent from
its manual, while granted operations are present. Call a withheld operation:
assert the answer says it is not enabled, the draft bytes are identical before and
after, and the last audit record shows a refusal decision with the capability rule
and the operation's name.
