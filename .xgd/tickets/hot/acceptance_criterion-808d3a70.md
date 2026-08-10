---
uid: acceptance_criterion-808d3a70
id: AC-955
type: acceptance_criterion
title: Reordering sibling regions and re-rendering yields addresses that still resolve
  to the nodes they were derived from
created_by: xgd
created_at: '2026-08-06T21:26:59.056293+00:00'
updated_at: '2026-08-10T08:49:59.807954+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Reordering two sibling regions in a site's definition and rendering the edit
channel again produces addresses that resolve correctly against the changed
definition: the addresses move with the nodes, and resolving each address from
the new render yields the node whose content it was stamped on.

The address is valid for the render it was produced from and no longer — an
address read from an earlier render is not expected to survive the reorder,
because any edit re-renders the page and regenerates every address.

## Verification

Render the edit channel of a seeded page and record the addresses of two sibling
copy regions. Swap those two siblings in the stored definition and render again.
Assert each region's address in the new render is the other one's former address,
and that resolving both new addresses against the changed definition yields the
copy that carries them.