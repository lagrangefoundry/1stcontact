---
uid: acceptance_criterion-4ecfd679
id: AC-1307
type: acceptance_criterion
title: 'Gradient stop colours are resolved in-browser to #rrggbb before the stops
  are parsed'
created_by: xgd
created_at: '2026-08-20T04:34:05.003843+00:00'
updated_at: '2026-08-20T04:34:05.003843+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: pending
---

## Criterion
Every colour token inside a captured gradient declaration is resolved **in the browser, at capture time**, to a `#rrggbb` literal before the TS-side `normalizeGradient` parses the stops, so a gradient authored in any colour space the engine understands is captured with a populated stop list rather than as a direction with no stops.

- A gradient whose stops compute to a modern colour space — `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` — is captured with each stop resolved to `#rrggbb`, in painted order. Without the resolution the stop regex (which reads only `#hex` and `rgb()`) matches nothing, the gradient captures as *direction only* (`135° []`), and that empty axis reads as a **clean match against any reproduction** — the capability's animating invariant inverted.
- Stop **positions**, direction, and gradient keywords are left untouched by the resolution; only colour tokens are rewritten.
- The resolution is applied to **both** captured declarations: the text-fill (`background-clip: text`) gradient and the panel `surfaceGradient`.
- A declaration that is not a gradient, and a `#hex`/`rgb()` token that is already parseable, pass through unchanged.
- A bundle captured before this resolution existed — whose stops captured empty — raises no delta rather than a false one.

## Verification
Capture a page whose text-fill wordmark gradient and whose panel surface gradient are both authored with utility classes that compute to `oklch()`/`color-mix()`; assert both captured gradients carry a non-empty stop list with each stop colour a `#rrggbb` literal, in painted order, and that the captured direction and any stop position offsets are byte-identical to the authored ones. Capture the same page authored with `#hex` stops and assert the captured stops are unchanged. Diff a pre-resolution bundle (stops captured empty) against a reproduction painting a real gradient and assert no gradient delta is emitted.
