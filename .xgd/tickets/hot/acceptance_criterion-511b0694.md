---
uid: acceptance_criterion-511b0694
id: AC-2529
type: acceptance_criterion
title: Rendering with a delivery manifest emits srcset and a computed sizes on the
  <img>; without one the plain src is emitted as before
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:33:01.816736+00:00'
updated_at: '2026-11-09T06:33:01.816736+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
When a page is rendered with a delivery manifest that has an entry for an image
leaf's site asset, the `<img>` keeps its authored `src`. It also carries a
`srcset` listing every rendition as `<url> <width>w` in ascending order, with the
original's own width last, and a `sizes` attribute derived from the node's
L1-pinned width:
- **Column-anchored:** one `(max-width: Wpx) Npx` condition per document ladder
  width, then the saturated width.
- **Keyframed:** one condition per segment at that segment's upper bound, then
  the last keyframe's width.
- **Fixed px:** that length.
- **Capped fluid:** `(max-width: Mpx) 100vw, Mpx`.

An uncapped fluid or hug width gets a `srcset` with no `sizes`. A `sizes` is
never emitted without a `srcset`. A `srcset` is emitted only when at least two
candidates survive the URL checks.

The asset is matched when `src` names a flat site asset as `/assets/x`,
`assets/x` or `./assets/x`. Absolute URLs, subdirectory paths and references
with a query or fragment get no ladder.

Rendering **without** a manifest (the draft and edit channels), or for a
picture the manifest has no entry for, emits the plain `<img src>` exactly as
before, with no `srcset`, `sizes`, `width` or `height`.

## Verification
Render one image leaf four times with a manifest entry: column-anchored,
keyframed, fixed-width and uncapped fluid. Assert the `srcset` candidates and
descriptors, each expected `sizes` string, and no `sizes` for the fluid case.
Render the same page without a manifest and assert the `<img>` markup matches
the pre-ladder output. Render with `src` spelled each of the three ways and
assert the same `srcset`. Render with an absolute `src` and assert there is no
`srcset`.
