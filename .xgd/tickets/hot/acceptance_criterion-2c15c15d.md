---
uid: acceptance_criterion-2c15c15d
id: AC-1562
type: acceptance_criterion
title: The rights record is shown and cannot be altered here; the description is the
  one editable thing
created_by: xgd
created_at: '2026-09-04T04:26:59.869631+00:00'
updated_at: '2026-09-04T04:45:38.627693+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

The detail area states, for the selected material: the name it arrived under, what kind of thing it
is, what the client said it was for, where it came from, the rights held over it, whether it may
appear on a published site, which site uses it, and — where it was retrieved from an address — that
address.

None of these can be changed from this surface: they are presented as a record to read, not as
controls to set. Rights are inferred from provenance precisely so the client is never asked a legal
question, so no control here offers to make material republishable, exportable, or differently
originated.

The description — what the system understands the file to be — is presented as the one thing the
client may change.

## Verification

Select a material and assert every field above is present with the stored value, including the
republishability shown as the state it actually holds. Assert that no field of the rights record
accepts input or offers a control that would submit a changed value. Assert that the description is
presented in an editable control. Attempt, through the surface, to change republishability and
assert the stored record is unchanged.