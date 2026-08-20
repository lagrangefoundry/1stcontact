---
uid: story-82eb6908
id: STORY-76
type: story
title: 'Gradients as a first-class value: stop positions and panel surface gradients
  — captured, authored, and diffed'
created_by: xgd
created_at: '2026-07-19T02:28:13.696712+00:00'
updated_at: '2026-08-20T07:00:24.958508+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 3
  uat_coverage: pass
  updated_by:
  - request-0698bbdf
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** gradients — both text-fill wordmarks and panel/card surfaces — captured with their direction and stop positions, with each stop's colour resolved to a literal the capture can actually parse, compared by `values-diff` as a fidelity axis, and authorable as a content value that resolves to a surface fill, **so that** a gradient's colours, direction, and stop offsets are reproduced faithfully and a clean `values-diff` genuinely means the gradient matches — I neither miss a stop-position drift ("orange too soon") nor a silently-missing panel gradient nor a gradient that captured as a direction with no stops at all, and I can author the panel gradient that closes the gap.

## Description
Promotes gradients from a colour-and-direction check to a first-class captured, diffable, and authorable value, across two gradient kinds:

1. **Text-fill stop positions (REQ-59).** A captured text-fill gradient records each stop's *position offset* (e.g. a stop held to 60%) alongside its colour, in painted order. `values-diff` compares stop positions within a default ±2 percentage-point tolerance, so two gradients with identical colours and direction but different stop offsets — the wordmark that turns orange too early — now diff as a real delta instead of passing clean. A stop with no explicit offset (evenly distributed) is compared on colour only, so absent offsets never fabricate a false delta.

2. **Panel/card surface gradients (REQ-62).** A gradient painted as an element's *surface* (a card/panel background sweep, distinct from the text-fill gradient and from the composited solid the run sits on) is:
   - **Captured** — the nearest painting ancestor's surface gradient is recorded, skipping a text-fill gradient and stopping at the first opaque solid (a gradient hidden behind an opaque fill never shows, so it is not the surface).
   - **Diffed** — a new surface-gradient axis compares direction + stops just like the text-fill gradient axis, catching the false match a render-only reproduction would produce (without a captured surface gradient, a missing panel gradient reads identically to a present one because the solid composite skips past it).
   - **Authored** — a standalone `gradient` content-field value type whose direction and stops resolve, via the shared surface-gradient resolver (`resolveSurfaceGradient`), to a panel/card `background-image: linear-gradient(...)` surface fill (superseding the element's solid fill; no fill when under-specified). Each stop colour is an absolute `#hex` literal: REQ-114 retired the module-level palette-role alias, so a role name is a validation error on the authoring path and is dropped rather than emitted on the resolver path.

3. **In-browser stop-colour resolution (REQ-72)** — the mechanism that makes any stop capturable at all. Each colour token inside a captured gradient declaration is resolved **in the browser**, at capture time, to `#rrggbb` before the TS-side `normalizeGradient` parses the stops; positions, keywords and direction are left untouched. A gradient authored with utility classes computes to a modern colour space (`oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()`) that the stop regex — which reads only `#hex` and `rgb()` — cannot see, so the whole stop list parsed empty and the gradient captured as *direction only* (`135° []`): a surface-gradient axis with nothing in it, which reads as a clean match against any reproduction and leaves the panel unreproducible. Resolution runs through a hidden probe element and the engine's own computed colour, so it accepts whatever syntax the engine understands rather than whatever the stylesheet was authored in, and it is applied to **both** captured declarations — the text-fill (`background-clip: text`) gradient and the panel `surfaceGradient`.

**In scope:** capture of stop positions and surface gradients; the in-browser resolution of gradient stop colours to hex on both the text-fill and panel capture paths; the stop-position and surface-gradient comparison axes and tolerances; the standalone gradient content-field value and the shared resolver that authors it into a surface fill.

**Out of scope:** homing the resolved gradient surface fill as an authored render on a specific module (the resolver is exported for any module's surface, but no module currently owns a padded/rounded/inset gradient-panel render); radial/conic gradients (linear sweep with a captured angle only); the solid composited surface-fill axis (that is [[1c_capture_diff_fidelity]]'s surfaceFill, a sibling captured alongside the surface gradient).

## Technical Context
- Reuses the existing gradient comparison used for text-fill gradients (direction tolerance, colour-stop equality); the surface-gradient axis maps to the same gradient defect kind, and stop-position tolerance is a new gate parameter (default 2). Sits alongside the rest of [[1c_capture_diff_fidelity]] (CAP-63), which owns the composited solid `surfaceFill` axis and element pairing this comparison relies on.
- **A capture-side colour parser narrower than the browser's own is a silent-skip machine.** The hexification in item 3 is the same lesson as the band-overlay scrim probe on the sibling capture story: the failure mode is not a wrong value but an *absent* one, and an absent stop list reads as "gradient matches" rather than "gradient unknown" — so the axis reports clean exactly where it has no evidence. Resolving through the engine puts the parser's vocabulary permanently in step with the syntaxes stylesheets are authored in.
- The gradient's stop colours are absolute literals on every path — authored, resolved and captured. REQ-114 removed the module-level palette-role alias, so the authoring side carries the `#hex` value directly and any palette indirection belongs to the L1 palette model, which resolves a site palette reference back to a literal before anything is emitted; the capture side (item 3) arrives at the same `#rrggbb` form through the engine. A non-literal reaching the resolver drops the whole gradient rather than emitting a partial sweep in a colour the author never chose.
- Captured shapes are optional/back-compatible: pre-existing bundles without stop positions or surface gradients still parse (positions default to unset, surface gradient to none), so a stale bundle does not fabricate deltas. A pre-REQ-72 bundle whose stops captured empty likewise raises no delta rather than a false one.

## Dependencies
None.

## Story Points
3