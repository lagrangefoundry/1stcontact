---
uid: bug-832b3ecf
id: BUG-355
type: bug
title: Builder grid column changes are reported as applied but don't render; video
  in an overlay composition won't layer under its text
created_by: xgd
created_at: '2026-11-05T17:49:48.259914+00:00'
updated_at: '2026-11-05T20:43:45.051572+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4d326d31
  commits:
  - working_sha: 3fea82eeee2520ac5c8026e87c3eb9ef3fcf8f7e
    reconcile_sha: null
    main_sha: null
  - working_sha: 75cb0eca314fae259ee0d372d9482bdb557dcb8e
    reconcile_sha: null
    main_sha: null
  version: 0.2.784
  story_points: 8
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

## What changed (BUG-355 free-coded fix)

**1. Grid columns.** The cause was the section's `cards` composition, not the builder's fields. When one group holds the cards, the composition rebuilt that group with its own 2 or 3 columns and threw away the group's `layout`, `columns` and `responsiveLayout`. Offerings (3 cards) and the steps (5) therefore drew 3 columns whatever was written. Validation reads the composed page, so it never saw the builder's columns either: the round-2 write (`columns: 2` with a one-keyframe track saying 1 column) was accepted without a word.
- Now a band group that **states its columns** (`columns`, or a `responsiveLayout` track that is a grid at some width) keeps its own layout, and the composition's 2–3 columns are only the default.
- A group that says only `stack`, `row` or `grid`, or has a track of stacks and rows, still gets the composition's band (REQ-463's row of reviews is unchanged).
- The band's stated columns now reach validation, so an inconsistent write (columns disagreeing with its track) is refused with the validator's message.

**2. Video under the overlay composition.** `overlay` only recognised an `image` as the picture, so a hero whose picture was a `video` was left as built, with its text below.
- A clip is now a picture to the compositions.
- Under `overlay`, the clip and a scrim box are laid under the text as two layers that each fill the section, using the new pin `fill` (below). The text sits over the clip at every width, and the scrim's edges are the clip's by construction.
- An image keeps its existing background-picture path.

**New L1 primitive: `pin: { corner: "fill" }`.** The node covers the whole box it sits in, out of flow and behind the box's other children (`z-index: -1`, with the box isolating itself), so a bare run after it still paints on top. Absent `inset` is 0 here, not the corner default. Builders can use it to lay a picture or a scrim under text without per-width copies.

**2b. Overlap false positive.** The layout check called a button drawn over a picture (the clip's poster `<img>`) "drawn on top of each other". A picture/control pair is now reported only when the picture is drawn over the control, as was already the rule for text.

**3. The ~8px strip.** It can't be reproduced from today's stored hero, which later rounds rebuilt. The 8px that was there is the corner pin's default inset (8px), applied to the pinned desktop text panel, which was as wide as the hero. That put the panel 8px inside the hero on the left and bottom and 8px past it on the top and right: item 4's near-miss. The overlay-with-clip composition removes the need for that panel, and the new check below reports it when it is built by hand.

**4. Layer edges.** There is a new layout check, `layer_edges` (a craft kind). It covers a painted layer over a picture of at least 40,000 px² (a fill at least 5% opaque, or a gradient; not a button) that covers at least a quarter of the picture, with at least a quarter of itself over it.
- The layer passes if it matches the picture's edges, each within 2px.
- It also passes if it is a clearly smaller panel: every edge it doesn't share sits at least 16px inside.
- An edge in between is reported as a near miss. The fix named in the finding is to pin the layer `fill` in the box the picture fills (or let an overlay composition lay it), or to make it a clearly smaller panel.

**Builder guidance (priming).**
- A section is one set of elements at every width, adjusted by responsive values, never a copy of a hero, its picture or its text per width.
- A different treatment at some width is the consultant's call (REQ-655's `layout_kept`), not the builder's.
- A clip is a picture that `overlay` lays under its text.
- A layer over a picture takes the picture's edges (pin `fill`) or is clearly smaller.
- Cards keep the columns their group states.

**Not in this change:**
- the host's "UNCHANGED after a fix round" verdict that blocked further delegation;
- builders ending partial with "not measured" checks when they run out of budget.

With the columns rendering, the first no longer traps a fix; the second is a separate budgeting question.

## Test plan

`tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.test.ts`, run with the real renderer, real Chromium, and the layout check over HTTP:
- **A cards band draws the columns its group states:** 2 columns at 768 and 1280 and 1 on a phone; a 5-step band stating `columns: 1` draws 1 column.
- **A band's stated columns are validated:** the round-2 write (`columns: 2`, track `[{at:375, grid, columns:1}]`) is refused.
- **An overlay hero with a `video` renders its text over the video at 375, 768 and 1280:**
  - exactly one clip;
  - the clip covers the hero edge to edge;
  - the title is inside the clip and drawn on top;
  - the scrim's edges are the clip's.
- **The overlay hero is not reported as an overlap or a near miss.** A button pinned over an in-flow clip's poster is not an overlap either.
- **A scrim 8 px off the video's edges is flagged** (`layer_edges`, naming the panel, the 8px and `fill`).
- **A scrim matching the edges, and a clearly smaller panel, both pass.**

All six fail on the code before this change (3 columns drawn; validation passes; no clip under the text; "the image and the button are drawn on top of each other"; no near-miss finding) and pass after it.

Regression scope: the layout-check, priming, composition, pin and grid suites (64 files, plus the REQ-463 workers suite). The only failures are ones that fail identically on clean xgd-working, or load flakes that pass when rerun alone.