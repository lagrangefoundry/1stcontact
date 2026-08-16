---
uid: acceptance_criterion-f4dc6dcc
id: AC-1082
type: acceptance_criterion
title: A change made through the surface lands on the draft through the same validated,
  all-or-nothing write the command line and the click-to-edit form reach
created_by: xgd
created_at: '2026-08-10T09:06:48.106410+00:00'
updated_at: '2026-08-16T03:39:08.451812+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The surface is a caller of the site's single write path, not a second one. An
address read from a page's map, used in a change through this surface, produces
the declared change report — what changed, and a line in plain words — and the
change is present in the draft on disk afterwards, indistinguishable from the same
change made from the command line or the click-to-edit form. Nothing about this
route skips validation, the all-or-nothing write, or the re-render.

## Verification

Read a page's map through the surface and take an address from it. Send a change
at that address. Assert the answer reports the changed address and a human-readable
message, and that reading the draft from disk shows the new value at that place.
Assert no additional write route exists: the same underlying edit is what the
command line invokes for the equivalent command.