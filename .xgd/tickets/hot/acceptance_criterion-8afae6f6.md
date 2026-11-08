---
uid: acceptance_criterion-8afae6f6
id: AC-2421
type: acceptance_criterion
title: 'near: names nearby anchor lines from the closed anchor vocabulary with signed
  distances, never snapping the point'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:33.163334+00:00'
updated_at: '2026-11-08T16:24:16.316857+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- For a point inside a measured SVG drawing, the `near:` row lists named anchor lines from the anchor vocabulary (REQ-209, e.g. cap-top or left edge of a named node) close to the point. They are reported separately for the horizontal and vertical axes, each as `<line> (<distance>u <above|below|left|right>)`, with the direction saying which side of the point the line is on.
- The reported user-space coordinates are the user's raw position. They are never moved onto a nearby line, even when a line is very close.
- The line names and distances are exactly what the platform's anchor tools (`relate` / `solve`) would compute for the same drawing and position. The builder runs the same anchor and measurement definitions, not a separate copy.
- When the drawing can't be measured, the `near:` row is left out and no lines are invented. Points not inside a drawing have no `near:` row.

## Verification
Place a point a known small distance below a glyph's cap-top in a measured SVG wordmark, send, and assert `near:` names that cap-top line with the expected distance and direction, and that the user-space y is the raw value, not the line's value. Assert the line names match the anchor vocabulary's output for the same input. Force the measurement to fail and assert there is no `near:` row while the other rows are still present.

"Same definitions, not a copy" is proved behaviourally, without reading any source as text (`tests/reconciliation-marked-points-served-modules.test.ts`):
- Drive `1c assets`, walk the emitted import graph from `/builder/main.js`, and assert it reaches `/framework/site-schema-anchors.js` and `/framework/measure-svg.js` (both imported by `main.js` itself) and `/builder/points.js`. Import the emitted modules and assert `ANCHOR_NAMES` and `nearestAnchors` give results identical to the source modules on a fixture measurement, and that the served `measureScript(svg)` is byte-identical to the one `measure_drawing` evaluates.
- In a real browser (skipped visibly where none can launch), run the emitted `points.js` over a real edit render, with the api built from the emitted framework modules by URL and no measurement injected. Click inside the drawing and assert `near:` equals `measure_drawing`'s measurement of the same SVG fed through the source `nearestAnchors` at the same user-space point.
