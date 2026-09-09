---
uid: acceptance_criterion-377af866
id: AC-637
type: acceptance_criterion
title: A text-block authored with a gradient panel renders a padded, rounded panel
  with that gradient surface
created_by: xgd
created_at: '2026-07-19T02:28:47.534345+00:00'
updated_at: '2026-09-09T23:29:01.401280+00:00'
completed_at: null
last_field_updated: status
status: deprecated
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: deprecated
  lifecycle: deprecated
---

**DEPRECATED** by REQ-84 (framework pivot C — delete the layout modules) and
REQ-96 (behavior modules layout-agnostic; `config` is never aesthetic), recorded
2026-09-09: this criterion asserts a render on the `text-block` layout module,
which REQ-84 deleted, via the module content-field gradient path REQ-96
superseded. Its verification calls `resolveSurfaceGradient`, which survives in
`packages/framework/src/modules/text-style.ts` with **zero production callers**
— two re-exports and two tests are its only references, and the L1 renderer
never calls it. The live authored gradient axis is the L1 `surfaceGradient` /
`gradientFill` leaf, owned by CAP-70 under this capability's "a value axis
follows the layer that renders it" rule; STORY-76's live scope is capture +
diff, and its Description now records this authoring half as legacy in the same
terms.

Deprecated as a criterion, not deleted as a fact: the resolver still exists and
its two tests still pass. When those references are removed this AC has nothing
left to describe.

[Original AC body preserved below for history.]

---

## Criterion
When a `gradient` content value is authored (a direction plus two or more colour stops), it resolves to a panel/card surface `background-image: linear-gradient(...)` carrying the authored direction and stop colours in painted order — a gradient surface fill, superseding the element's solid fill. Each stop colour is resolved as either an absolute hex literal or a palette-role alias (absolute-or-overlay). When fewer than two stops are supplied the value is under-specified and resolves to no fill, so the caller keeps its solid treatment.

## Verification
Call the shared surface-gradient resolver (`resolveSurfaceGradient`) with a gradient declaring a direction and two stops — one an absolute hex, one a palette role. Assert it returns a `background-image: linear-gradient(<direction>, <hex> 0%, var(--color-<role>) 100%)` declaration carrying the resolved direction and stop colours, and returns an empty declaration (no fill) when given a single stop.
