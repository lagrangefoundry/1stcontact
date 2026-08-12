---
uid: acceptance_criterion-a6b197b2
id: AC-1128
type: acceptance_criterion
title: The envelope bounds a colour adjustment through the shared surface check
created_by: xgd
created_at: '2026-08-12T21:13:20.277065+00:00'
updated_at: '2026-08-12T21:23:00.233126+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
The colour adjustment is bounded by the **same shared surface check** as every
other paint axis, so it cannot escape the envelope by being declared somewhere
nobody remembered to check.

Rejected, with the offending field located in the returned error list:
- a **scaling adjustment** — saturation, brightness or contrast — outside
  `[0, 4]`. The ceiling is a robustness rule rather than taste: an adjustment
  four times over is no longer an adjustment but a way to delete the content the
  page still pays to download, which is the same reasoning the substrate already
  applies to a texture's tile period;
- a **hue shift** outside the rotation bounds every other angle the substrate
  admits is held to;
- a **blur of the node's own paint** outside the effect-length bounds;
- a greyscale, sepia or invert outside `0..1`, and **any unknown or extra key**
  on the adjustment object — so no freeform filter can be smuggled in beside a
  typed field.

Because the check is shared, an **interaction-state adjustment is bounded by the
identical rule as the base node**: an adjustment that only fires on pointer-over
or on keyboard focus is rejected for an out-of-range value exactly as the node's
own would be. A state is not a route around the ceiling.

The bound applies wherever a site definition is validated, so a page whose L1
body was folded from a capture and one typed by a person or an AI meet the same
limits.

## Verification
Submit documents carrying an out-of-range scaling adjustment, hue shift, own-paint
blur, out-of-range greyscale, and an unknown key on the adjustment object, and
observe rejection in each case with the error path naming the offending field.
Submit the same out-of-range adjustment inside a hover state and inside a focus
state and observe rejection identical to the base node's. Submit the boundary
values themselves and observe acceptance.