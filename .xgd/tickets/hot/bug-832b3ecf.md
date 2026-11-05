---
uid: bug-832b3ecf
id: BUG-355
type: bug
title: Builder grid column changes are reported as applied but don't render; video
  in an overlay composition won't layer under its text
created_by: xgd
created_at: '2026-11-05T17:49:48.259914+00:00'
updated_at: '2026-11-05T18:45:16.167971+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

**Context:** a builder revision pass on a home page with sections stored separately.

1. **Grid columns.** The builder reported setting `columns` and `responsiveLayout` on two grids: offerings (3 cards) to 2 columns at desktop and tablet, and how-it-works (5 steps) to 1 column. The change record shows `columns` and `responsiveLayout` changed at offerings:0.2 and how-it-works:0.2. The rendered draft at 1280px still shows 3 columns in both grids. The host's layout check then reported the line-length findings as "UNCHANGED after a fix round" and forbade another builder pass, so the faults now can't be fixed through delegation. Either the written fields don't drive the render (responsiveLayout overriding columns?), or the builder wrote fields that are ignored, and nothing tells it so.

2. **Video under the overlay composition.** When a hero's picture element was swapped from an image to a `video` element, the `overlay` composition stopped layering the text over it, and the text rendered below. The builder worked around this with `pin`. The layout check now reports "the image and the button are drawn on top of each other" for the intended overlay at every width, and calls it unfixable. It is the intended design, so this looks like a false positive for video plus pinned text.

3. **A strip of about 8px** shows along the left edge of a `bleed` hero (desktop and phone), and the builder couldn't locate its cause.

**Expected:** the column changes render, overlay works with a video, and an intentional overlay isn't flagged as a collision.

A further pass confirms it: three builder rounds on the same page, each reporting changes to the grid columns, and the 1280px render still shows 3 columns in both grids (offerings has 3 cards; the steps grid has 5, leaving an empty slot in its second row). The `bleed` hero still shows a strip of about 8px of page background down its left edge at 1280 and 375. Builders also keep failing their own measurable checks with "not measured" when they run out of budget, so each pass ends partial.


## 4. The overlay hero differs by width, and its scrim doesn't match the picture (operator, 2026-11-05)

This is a consequence of item 2's `pin` workaround.
- The builder made **three copies of the video**, one each for desktop, tablet and phone, and **two copies of the hero text**.
- **At desktop** the text sits on a translucent dark gradient panel, pinned bottom-left over the video.
- **At tablet and phone** the text drops *below* the video onto the page background, so phone and tablet look like a different design.
- The desktop panel's box is sized by its content and padding, not by the picture, so its edges sit **slightly off the video's edges**. That near-miss reads as a mistake.

**Expected:**
- **One hero at every width:** one `video` element and one text group, adjusted with responsive properties rather than per-width copies. The text and scrim sit over the picture at phone, tablet and desktop alike. On a phone the scrim may cover more of the picture, but the treatment is the same.
- **A layer over a picture** (scrim, translucent panel) either **matches the picture's edges** (within the 2 px the other checks use) or is **clearly a smaller panel** inside it. The layout check reports a near-miss with a fix the builder can act on, as it already does for ragged rows.
- **Builder guidance:** never duplicate a hero per width to get a different treatment.
- **A deliberate difference across widths** (say, text below the picture on a phone) is the consultant's call, recorded with `layout_kept` and a reason, as REQ-655 extends it. The builder doesn't choose it on its own.

**Tests (added):**
- An overlay hero with a `video` renders its text over the video at 375, 768 and 1280.
- A scrim 8 px off the video's edges is flagged.
- A scrim matching the edges, and a clearly smaller panel, both pass.
