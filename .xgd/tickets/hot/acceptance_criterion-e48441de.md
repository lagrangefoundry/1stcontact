---
uid: acceptance_criterion-e48441de
id: AC-874
type: acceptance_criterion
title: The scaffolded root declares no per-width geometry, laying out by flow so the
  starting page centres itself at every width with nothing absolute to unpick
created_by: xgd
created_at: '2026-08-06T03:43:03.415496+00:00'
updated_at: '2026-08-10T08:16:12.050617+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The root of a newly created site's layout document carries no per-width geometry
track: it declares a flowed layout with centred alignment and its own padding,
and its children carry no absolute per-width boxes either. Consequently the
starting page centres its content at every width on the ladder without any
width-specific values for the author to remove before their first edit.

## Verification
Create a site and assert its layout document's root declares a flowed, centred
layout and that neither the root nor its children carry a per-width geometry
track. Render the site and assert the emitted layout is flow-based and centred
with no per-width positioning for the seeded nodes.