---
uid: request-40136a30
id: REQ-25
type: request
title: 'Header-over-hero: composite header onto shared image band'
created_by: xgd
created_at: '2026-07-02T18:37:43.634669+00:00'
updated_at: '2026-07-09T20:00:47.159464+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: medium
  story_points: 3
  auto_merge_back: true
  needs_review: false
  commits:
  - 94cd1ecfda62b31719175d2cf2079d41387983c3
  version: 0.0.17
  bundled_in: bundle-f39884d2
---

## Scope — structural capability

Allow a `header` (top chrome) to sit **over** the following section's background image as one continuous band, rather than rendering as its own separate band above it.

Driven by the **gigabytealchemy.ai** import (REQ-20): the reference top is a single dark lab image with the wordmark centered over it and the hero copy below — header and hero share one image band. Our current output renders the header as a discrete dark band stacked above the hero image.

## Acceptance criteria

- A header can be composited over the adjacent hero/background image (shared image band), with content (wordmark) legible over it — reusing the REQ-14 overlay/legibility mechanism, no raw CSS.
- Expressed through the module/composition model (a dial, a "transparent/overlay" header variant, or the compositing path), not a per-site hack.
- gigabytealchemy renders header + hero as one continuous image band matching the reference.

## Notes

- Likely intersects REQ-15 (`layer`/compositing). Decide whether this is a `header` variant ("overlay") or a compositing-layer concern, and note the call.
- Blocks REQ-20 fidelity gap #2.

## Design decision (the "note the call" item)

**Call: compositing path in the render pipeline, expressed as a `header` `overlay` variant.**

- Add an `overlay` variant to the `header` module. It renders transparent (no surface fill, no bottom border) so the band behind it shows through continuously.
- The render pipeline (`tools/generate` `renderModules`) does *not* emit an `overlay` header as its own band. Instead it floats the header absolutely across the top of the **immediately-following** module's band, so header + next section share one continuous background band. New static structural CSS (`OVERLAY_BAND_CSS`) — no instance-supplied/raw CSS.
- The shared image is provided by the following band: the hero `bg-image` variant (the blessed image-hero path) or any module carrying a REQ-14 `background`. Legibility over the band reuses the REQ-14 overlay mechanism (dark image / overlay tint), not a new path.
- Why a variant + pipeline compositing rather than a `layer` (REQ-15) concern: REQ-15 composites children *within* one host module's box; here we need two sibling module instances (header + hero) to share one band, which is a cross-instance pipeline concern. Kept type-general: any `header@overlay` followed by a band, not a gigabyte hack.

**Commit scope note:** REQ-25 commits the framework capability + UATs only. The `storage/sites/gigabytealchemy/` tree is untracked REQ-20 import work; the home.json header→overlay flip is made to verify AC3 but is left for REQ-20 to commit (not staged into REQ-25).