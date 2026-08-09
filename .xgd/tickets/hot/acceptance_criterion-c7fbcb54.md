---
uid: acceptance_criterion-c7fbcb54
id: AC-839
type: acceptance_criterion
title: A text run, painted box or laid-out container declaring a link becomes the
  navigable element itself, keeping its own styling identity, paint, measure and interaction
  states
created_by: xgd
created_at: '2026-08-06T02:47:50.764517+00:00'
updated_at: '2026-08-09T05:41:11.277773+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-2e4e2c45
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A published page containing a text run, a painted box or a laid-out container that
declares a link target presents that node as a link to that target. The element
the author styled *is* the link — it is not enclosed in an additional element —
and it keeps:

- the same styling identity it would have had un-linked, so every paint axis
  (fill, gradient, border, radius, shadow), every measure and every declared
  interaction state still resolves against the element the reader clicks;
- its children and text content unchanged, escaped as before;
- its declared accessible name when one is authored, otherwise the accessible
  name its visible content provides.

Activating the link navigates the browser to the declared target.

## Verification
Publish pages whose root is (a) a text run, (b) a box and (c) a container, each
declaring a link target and a distinctive paint value. Assert the published markup
presents each as a link carrying that target, that the original element type is
no longer present for the linked node, and that the published stylesheet still
carries the node's paint value bound to the same styling identity the link
carries. Assert an authored accessible name appears as the link's name. Drive one
such page in a browser and assert activating the link results in a navigation to
the declared target.