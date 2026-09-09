---
uid: story-82eb6908
id: STORY-76
type: story
title: 'Gradients as a first-class value: stop positions and panel surface gradients
  — captured, authored, and diffed'
created_by: xgd
created_at: '2026-07-19T02:28:13.696712+00:00'
updated_at: '2026-09-09T23:28:27.400442+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 3
  uat_coverage: stale
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** gradients — both text-fill wordmarks and panel/card surfaces — captured with their direction and their stop positions resolved to comparable colours, and compared by `values-diff` as a fidelity axis, **so that** a gradient's colours, direction, and stop offsets are reproduced faithfully and a clean `values-diff` genuinely means the gradient matches — I neither miss a stop-position drift ("orange too soon") nor a silently-missing panel gradient, nor have a modern-colour-space gradient capture as an angle with no stops at all.

## Description
Promotes gradients from a colour-and-direction check to a first-class captured and diffable value, across two gradient kinds:

0. **Stop colours resolved to hex *in-browser* (REQ-72) — the precondition the rest of this story stands on.** A Tailwind-authored gradient computes to `oklch(...)` / `oklab(...)` / `color(...)`, which the TS-side stop parser cannot read; a stop list it cannot read is an empty stop list, so the gradient captures as direction-only and the stop-position axis below has nothing to compare. Stop colours are therefore normalised to `#rrggbb` **inside the page**, where the browser will do the colour-space conversion for us, before the stop list ever crosses back to the tool. This applies to both gradient kinds — surface and text-fill — and is what makes a card gradient capturable at all rather than an angle with empty stops.

1. **Text-fill stop positions (REQ-59).** A captured text-fill gradient records each stop's *position offset* (e.g. a stop held to 60%) alongside its colour, in painted order. `values-diff` compares stop positions within a default ±2 percentage-point tolerance, so two gradients with identical colours and direction but different stop offsets — the wordmark that turns orange too early — now diff as a real delta instead of passing clean. A stop with no explicit offset (evenly distributed) is compared on colour only, so absent offsets never fabricate a false delta.

2. **Panel/card surface gradients (REQ-62).** A gradient painted as an element's *surface* (a card/panel background sweep, distinct from the text-fill gradient and from the composited solid the run sits on) is:
   - **Captured** — the nearest painting ancestor's surface gradient is recorded, skipping a text-fill gradient and stopping at the first opaque solid (a gradient hidden behind an opaque fill never shows, so it is not the surface).
   - **Diffed** — a new surface-gradient axis compares direction + stops just like the text-fill gradient axis, catching the false match a render-only reproduction would produce (without a captured surface gradient, a missing panel gradient reads identically to a present one because the solid composite skips past it).
   - **Authored (superseded — legacy module content-field path).** As originally landed, a standalone `gradient` content-field value type whose direction and stops resolved, via the shared surface-gradient resolver (`resolveSurfaceGradient`), to a panel/card `background-image: linear-gradient(...)` surface fill. **This authoring half is no longer live.** REQ-84 deleted the layout modules that hosted the content field, and REQ-96 forbids aesthetic values in a module's `config` at all; `resolveSurfaceGradient` survives in `packages/framework/src/modules/text-style.ts` with **zero production callers** — only two re-exports and two tests reference it, and the L1 renderer never calls it. It is retained here as documented legacy, not as behaviour the capability still claims. The gradient axis an author writes today is the **L1** `surfaceGradient` / `gradientFill` leaf, which is owned by the framework substrate capability (CAP-70) under this capability's "a value axis follows the layer that renders it" rule — not by this story.

**In scope:** in-browser resolution of stop colours to a comparable hex form (the precondition above); capture of stop positions and surface gradients; the stop-position and surface-gradient comparison axes and tolerances. The live scope of this story is **capture + diff**.

**Out of scope:** the authoring path in any live form — the superseded module content-field gradient and its `resolveSurfaceGradient` resolver are recorded above as legacy, and the live L1 gradient axis belongs to CAP-70; homing a resolved gradient surface fill as an authored render on a specific module (moot — the modules that would have hosted it were deleted by REQ-84); radial/conic gradients (this story is linear sweep with a captured angle only; radial arrived later as an L1 axis and is CAP-70's); the solid composited surface-fill axis (that is STORY-75's `surfaceFill`, a sibling captured alongside the surface gradient).

## Technical Context
- Reuses the existing gradient comparison used for text-fill gradients (direction tolerance, colour-stop equality); the surface-gradient axis maps to the same gradient defect kind, and stop-position tolerance is a new gate parameter (default 2). Sits alongside STORY-75 in this same capability (CAP-63, 1c Capture & Diff Fidelity), which owns the composited solid `surfaceFill` axis and the element pairing this comparison relies on.
- The hex normalisation must run **in the page**, not in the tool. It is not a formatting preference: the conversion from `oklch`/`oklab`/`color()` to sRGB is the browser's own, and doing it tool-side would mean reimplementing colour-space maths against whatever syntax the reference site's build emitted next. Resolving in-browser makes the captured stop list syntax-independent by construction, which is why the axis can be compared by simple colour equality at all.
- **The authoring half of this story is legacy and is not maintained.** The supersession is recorded in the Description and in this capability's Scope bullet 2 in the same terms; when the resolver's remaining re-exports and tests are removed, this story loses a paragraph rather than a guarantee. AC-637, which asserted a `text-block` render, names a module REQ-84 deleted and is deprecated accordingly.
- Captured shapes are optional/back-compatible: pre-existing bundles without stop positions or surface gradients still parse (positions default to unset, surface gradient to none), so a stale bundle does not fabricate deltas.

## Dependencies
None.

## Story Points
3