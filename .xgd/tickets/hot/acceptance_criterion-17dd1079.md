---
uid: acceptance_criterion-17dd1079
id: AC-884
type: acceptance_criterion
title: 'Two renders of the same document produce byte-identical output: the pointer
  driver is a fixed, site-independent asset carrying no radius, colour or region detail,
  and it is emitted only when a document uses the axis'
created_by: xgd
created_at: '2026-08-06T18:09:35.499279+00:00'
updated_at: '2026-08-08T00:43:46.738753+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Rendering the same site definition twice produces byte-identical published
output. Nothing about the accent's presentation is decided at render time by
chance; the region's resting shape is fixed by the values the definition declares,
which is what lets a captured page reproduce.

The pointer driver is a fixed, site-independent asset: it is byte-identical across
two different sites' pages and contains none of the accent's values — no colour,
no reach, no softness, no roughness, no count of the region's features. It is a
single driver for every accented node on the page rather than one per node, and a
page whose nodes declare no accent carries no pointer driver whatsoever.

## Verification
Render the same definition twice and assert the outputs are byte-identical.
Render two different sites' accented pages and assert their pointer drivers are
identical and contain none of either definition's accent values. Render a page
with several accented nodes and assert exactly one driver is present. Render a
page with no accent declared and assert no pointer driver is present.