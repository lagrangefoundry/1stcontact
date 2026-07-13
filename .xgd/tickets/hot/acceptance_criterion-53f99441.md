---
uid: acceptance_criterion-53f99441
id: AC-589
type: acceptance_criterion
title: Modern-CSS colour formats resolve to an accurate sRGB hex, not the inferred
  sentinel
created_by: xgd
created_at: '2026-07-13T20:13:18.899163+00:00'
updated_at: '2026-07-13T20:20:48.456739+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-79e068e5
  kind: behavior
  regression_only: false
---

## Criterion
When a page whose computed text or border colours are expressed in a modern CSS
colour format (`oklch()`, `lab()`, `lch()`, or `color()`) is captured, each
affected element's captured colour is an `#rrggbb` hex string equal to the
element's actual rendered sRGB colour, and the element is NOT marked
colour-inferred. A previously-hidden colour difference between such a resolved
value and the reproduction's authored colour is therefore observable in the
comparison output.

## Verification
Capture a fixture page that renders text/border colour in `oklch()` (and the
other modern forms) against a real browser. Assert the captured element's colour
is the expected `#rrggbb` (e.g. a dark-slate body colour resolves to its true
hex, not `#000000`), that no element is flagged colour-inferred, and that the
resulting comparison surfaces the colour delta against a reproduction authoring
a different colour.