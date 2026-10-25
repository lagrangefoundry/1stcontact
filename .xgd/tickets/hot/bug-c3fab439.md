---
uid: bug-c3fab439
id: BUG-259
type: bug
title: 'L1 renderer: an inlined drawing (parts: true) ignores objectFit/objectPosition,
  so effects laid over a photo drift when the window resizes'
created_by: EPIC-19
created_at: '2026-10-23T18:46:38.091217+00:00'
updated_at: '2026-10-23T23:23:48.727908+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dcf8bf3a
  commits:
  - working_sha: 49bfbc7d73d9fbd701ad2a433c4a70fdb47659c3
    reconcile_sha: null
    main_sha: null
  - working_sha: 6edf357c961adf88b05dcbb4bd57f5777a5eac18
    reconcile_sha: null
    main_sha: null
  version: 0.2.601
---

## Symptom

On Ariel's home page hero, the builder layered pulsing glow points (mouth, both
horns, smoke) over the "Old Scratch" photo. As the browser is resized, the points
drift across the picture instead of staying on the flames.

## Cause

The construction is right. The renderer drops part of it.

- The hero holds two `image` nodes with **identical** geometry and sizing, both
  `place: absolute`, both `objectFit: cover`, `objectPosition {xPct: 50, yPct: 8}`:
  - the photo `/assets/Fiery-Scrap-Metal-Devil-at-Dusk.png` (1536×1024);
  - the glow drawing `/assets/scratch-flicker-2.svg` with `parts: true` (REQ-335)
    and `animate` tracks on `#mouth`, `#horn-left`, `#horn-right` and `#smoke`.
    Its `viewBox="0 0 1536 1024"` is the photo's own frame, so every point is in
    image space (for example `#mouth` at 1121,356).
- The photo is a real `<img>`, so `object-fit: cover; object-position: 50% 8%`
  apply. Its scale is max(W/1536, H/1024), cropped 50% horizontally and 8%
  vertically.
- **The inlined drawing is a `<span>` wrapping an `<svg>`**
  (`packages/framework/src/l1/render.ts` ~5142–5160). The node's class rules,
  `object-fit` and `object-position` included, land on that `<span>`, where they
  do nothing. The SVG fills 100%×100% with the default `preserveAspectRatio="xMidYMid
  meet"`, which is **contain**: scale min(W/1536, H/1024), centred.
- The two layers therefore agree only when the box is exactly 3:2. At 1280×680 the
  mouth is about 60px left and 47px above where the photo puts it. At 375×520 it
  is about 93px off. The gap changes continuously as the window resizes.

## Fix

**An inlined drawing is fitted exactly like an `<img>` of the same drawing
would be.** For every `objectFit` (`cover`, `contain`, `fill`, and any others the
schema allows) and every `objectPosition` (any `xPct`/`yPct`, not only 0/50/100),
the renderer places the inlined SVG so its content lands where the browser would
put the image. A drawing laid over a photo in the same box with the same fit
therefore stays registered at every size.

- `preserveAspectRatio` alone cannot express an arbitrary `object-position`. It
  only offers Min, Mid and Max. One exact pure-CSS route: the wrapper is a size
  container with `overflow: hidden`, and the SVG is absolutely positioned with
  `width: max(100cqw, 100cqh × ar)`, `height: max(100cqh, 100cqw ÷ ar)` for
  `cover` (min for `contain`), and `left`/`top` = (container − SVG) × position%.
  Those are `object-position`'s own semantics. The ratio comes from the drawing's
  `viewBox`. The child session may choose another way if it is exact.
- The output is still generated only by the renderer from typed values (numbers
  and the validated `viewBox`). No instance string reaches the CSS, as the
  security policy requires.
- `marked-points.ts`'s `toUserSpace` already models this chain for reading
  clicks. Keep it and the renderer agreeing, sharing the mapping if that is
  simple.

## Test plan

`tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.*`, real Chromium:

- A fixture with a 1536×1024 photo and a `parts` drawing in the same box, both
  `cover` with `objectPosition {50, 8}`, rendered at box sizes 1280×680, 768×600
  and 375×520. A marked part's centre on screen is within 1px of where the
  photo's own pixel at that image coordinate is drawn.
- The same check for `contain`, and for `cover` with an off-centre position such
  as `{20, 80}`.
- A drawing with no `objectFit` renders as before.
- Re-run the REQ-335 parts and animate UATs, the l1 render and security UATs,
  and the marked-points UATs.

-