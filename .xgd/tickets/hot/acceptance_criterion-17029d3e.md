---
uid: acceptance_criterion-17029d3e
id: AC-502
type: acceptance_criterion
title: Hero exposes a headingTreatment dial that colours the heading independently
  of the surface
created_by: xgd
created_at: '2026-07-09T21:57:05.739746+00:00'
updated_at: '2026-07-09T21:57:05.739746+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `hero` module exposes a `headingTreatment` dial (`plain` | `accent` | `gold` | `gradient`, default `plain`) that colours the heading independently of the surface text colour: `plain` inherits the surface text colour; `accent` fills the heading with the solid site accent (`--color-accent`); `gold` clips the same fixed metallic-gold gradient as the header wordmark to the heading glyphs; and `gradient` clips a framework-computed linear-gradient to the heading glyphs, read from a structured `headingGradient` content field (a direction plus two or more palette-role stops — see the gradient-text-treatment criterion). When the gradient treatment is selected but the field is missing or under-specified, the heading falls back to its inherited colour.

## Verification
Render a hero at each `headingTreatment` value and assert the heading markup carries the corresponding treatment hook — a solid accent colour for `accent`, a clipped gold gradient for `gold`, and a clipped `background-clip: text` inline gradient for `gradient` — while defaulting to the inherited surface colour for `plain` (and when a gradient treatment has no valid `headingGradient`).
