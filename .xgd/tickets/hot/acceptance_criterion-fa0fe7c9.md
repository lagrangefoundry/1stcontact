---
uid: acceptance_criterion-fa0fe7c9
id: AC-2401
type: acceptance_criterion
title: solve returns the node, attribute and value that achieve an equals or offset
  relation, and applying it zeroes the relate delta
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:51.492953+00:00'
updated_at: '2026-11-08T10:12:49.082174+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
`solve({ so, equals, offset?, move? })` returns `node`, `attr`, `value` (what to write), `from` (what is there now), `axis` and `delta` (the root-space correction). The attribute is `x`/`y` for `<text>`, `<tspan>` and `<rect>`, and `cx`/`cy` for `<circle>` and `<ellipse>`, on the axis inferred from the anchors. When the node sits under a scale, the value is correct in the node's local space. With `offset` n, the solved node lands n units past `equals`. `move` may be omitted, because `so` names the node. Writing `value` into `attr` and re-measuring makes relate(`so`, `equals`) zero, or −offset when an offset is given, within rounding.

## Verification
On the wordmark fixture, solve `#ord.cap-top` equals `#one.cap-top`; assert the result names `#ord` and `y`, apply the value, and assert the relate delta is 0. Repeat with an offset, with a scaled parent group, and for `<rect>` (`x`) and `<circle>` (`cx`/`cy`).

In a real browser (skipped, with the reason, where no Chromium can launch), so that the scale and the authored attribute are the ones the shipped `measureScript` reads: write a drawing with `#big` at `y="20"` inside `<g transform="scale(2)">`. Solve `#big.baseline` equals `#one.baseline` and assert `attr` y, `from` 20, `delta` 22 and `value` 31. Rewrite the drawing with that value through `write_image` and assert `relate` is within 0.01 of zero.
