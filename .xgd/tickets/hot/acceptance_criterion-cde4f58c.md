---
uid: acceptance_criterion-cde4f58c
id: AC-2531
type: acceptance_criterion
title: 'A background image takes the ladder through per-breakpoint rules: the base
  uses the smallest-width choice and an override is emitted only where the choice
  changes'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:33:05.202469+00:00'
updated_at: '2026-11-09T17:43:14.042536+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
When a node's `backgroundImageUrl` names a site asset that the delivery manifest
has an entry for, with at least two renditions, and the document declares a
width ladder, the background picture is chosen per breakpoint from the
renditions:

- At each ladder width, the renderer takes the node's box width: its column
  anchor, then its keyframes (segment upper bound), then fixed px, then capped
  fluid. A box whose width is none of these is taken as the viewport width.
- The chosen rendition is the **smallest whose width covers twice the box
  width**, or the original (the last rendition) when none does.
- The base rule's `background-image` uses the choice at the **smallest** ladder
  width.
- A `(min-width: Wpx)` rule restating `background-image` is emitted at a wider
  ladder width **only where the choice differs from the previous one**. A picture
  that resolves to one rendition across several widths emits one rule for them.
- No `image-set()` is used.

With no manifest, no entry, a single-rendition entry or no document ladder, the
surface's declarations are exactly as before.

## Verification
Render a band with a background image and a ladder whose box widths resolve to
the same rendition at two adjacent ladder widths and a different one at a third.
Assert that the base rule names the smallest-width choice, that an override is
emitted only at the width where the choice changes, and that a wide box picks
the original. Render without a manifest and assert the background declarations
match the pre-ladder output.