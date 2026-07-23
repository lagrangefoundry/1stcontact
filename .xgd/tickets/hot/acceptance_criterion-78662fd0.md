---
uid: acceptance_criterion-78662fd0
id: AC-682
type: acceptance_criterion
title: Well-formed L1 document is accepted as a typed layout tree
created_by: xgd
created_at: '2026-07-22T19:31:43.320246+00:00'
updated_at: '2026-07-23T07:56:03.702600+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A well-formed L1 document is accepted by validation and returns the typed
document. "Well-formed" means: a strictly ascending viewport-width ladder; a
root node that is one of the closed set of kinds (`box`, `text`, `image`,
`slot`, `container`); leaf style axes given as typed literals / closed enums
(e.g. hex colour, finite font-size/weight, text-align/transform/style enum,
surface fill, radius, opacity, object-fit); optional per-viewport geometry
keyframes whose widths are all drawn from the document's declared widths; and
optional structure primitives (per-axis sizing `fixed | fluid | hug`,
distribution, alignment, viewport-range visibility).

## Verification
Submit a hand-authored valid document (a hero: a fluid black box containing a
white wordmark and a muted subhead, with interpolate and snap geometry tracks
across a 6-width ladder) to the validator and observe an "ok" result carrying
the parsed typed document. Vary each optional primitive and confirm each valid
form is accepted.