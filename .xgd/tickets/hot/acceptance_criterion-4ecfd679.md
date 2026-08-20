---
uid: acceptance_criterion-4ecfd679
id: AC-1307
type: acceptance_criterion
title: 'Gradient stop colours are resolved in-browser to #rrggbb before the stops
  are parsed'
created_by: xgd
created_at: '2026-08-20T04:34:05.003843+00:00'
updated_at: '2026-08-20T05:03:40.887676+00:00'
completed_at: null
last_field_updated: body
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
- The resolution is a **capture-time** property, so it holds only over a bundle captured with it. A bundle captured *before* it existed carries an empty stop list, which is stale reference data and not a value the diff can repair — REQ-72's remedy is to re-capture ("Re-capture gigabyte; the stops then populate"), and until then the stale bundle's gradient axis is exactly the Type-A capture gap REQ-72 was raised to close.

## Verification
Capture a page whose text-fill wordmark gradient and whose panel surface gradient are both authored with utility classes that compute to `oklch()`/`color-mix()`; assert both captured gradients carry a non-empty stop list with each stop colour a `#rrggbb` literal, in painted order, and that the captured direction and any stop position offsets are byte-identical to the authored ones. Capture the same page authored with `#hex` stops and assert the captured stops are unchanged, and that a non-gradient declaration is not rewritten into one.

**Evidence gating.** Only a real engine resolves a modern colour space (`getComputedStyle` under jsdom returns an `oklch()` token verbatim), so the oklch/`color-mix()` case is browser-gated and skips where no Chromium is provisioned. The engine-independent half of the same claim — a non-hex `rgb()` stop hexified on both captured declarations, positions and direction untouched, hex pass-through, non-gradient unchanged — runs headlessly over the real `EXTRACT_SCRIPT`, so this criterion contributes assertions in every run.
