---
uid: acceptance_criterion-ee91ec33
id: AC-816
type: acceptance_criterion
title: Backdrops are captured anywhere in the document, and excluded where they would
  report what is not painted
created_by: xgd
created_at: '2026-08-06T01:46:09.409406+00:00'
updated_at: '2026-08-07T23:11:31.260509+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The imagery and full-bleed fills a page paints behind its content are captured
wherever they sit in the document — not only on a top-level band root. A nested hero
photograph on a page-builder site, where every panel sits inside one wrapper, is
recorded with its image handle and the fill painted beneath it (a photograph layered
over a solid is darkened by that solid; capturing the image alone reproduces it at
full brightness). Each is carried as a text-free element, so it travels the same path
to the reproduction as any other captured media.

Three cases are deliberately **not** captured as backdrops, each being a way the
capture would otherwise report something that is not painted:
- an inline `data:` payload — widget chrome, never a mirrored asset;
- a coloured box that is not full-bleed — a card, already reconstructed from the
  surfaces its runs sit on;
- a full-bleed **translucent** fill — a scrim, already recorded as the band's
  overlay and layered above the image it veils. Capturing it again paints it twice,
  and because a fill's alpha lives in its colour rather than in opacity, the second
  copy lands opaque and blacks out the photograph beneath.

**Full-bleed means touching both document edges**, not exceeding a fraction of the
width. A fraction is unstable across the viewport ladder — a 720px card is 94% of a
768px rung and half of a 1440px one — so a content card would qualify at the narrow
rungs only and be materialised at its widest geometry.

## Verification
Capture a page with a nested background photograph over an opaque fill, a nested
full-bleed panel fill, a narrower coloured card, a full-bleed translucent scrim and a
`data:` background. Assert the photograph and the full-bleed panel are captured, each
carrying its own fill; assert the card, the scrim and the `data:` background are not;
assert the scrim is still present as the band's overlay; and assert the card does not
qualify at any rung of the ladder.