---
uid: request-47cb87c6
id: REQ-622
type: request
title: 'Layout checks: overlaid text or shading never covers a picture''s subject;
  stacked buttons line up on both edges'
created_by: EPIC-19
created_at: '2026-10-31T22:49:11.781154+00:00'
updated_at: '2026-11-01T15:41:18.849447+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-fe3bc1e1
  commits:
  - working_sha: 336448a28f76e3b632c2cf4aa455e8939f992406
    reconcile_sha: null
    main_sha: null
  - working_sha: 7d3056365d8589bac4f00cf70a818b321050f492
    reconcile_sha: null
    main_sha: null
  version: 0.2.724
  story_points: 8
---

## Why

Operator, production, 2026-10-31, Ariel's Arc Welding home hero (`site_be615746320df3268946af454ff075e2`, section `hero`):

1. "I am disappointed to have to tell the consultant that its shaded box covered Old Scratch." The hero is an overlay: video `hero-video` (poster `Fiery-Scrap-Metal-Devil-at-Dusk.png`, `objectPosition` 60%/35%) under the text box `hero-text` (padded, shaded). The box sat on the sculpture, the photo's whole point, and nothing flagged it. The client had to.
2. "There are 2 CTA buttons on the hero segment on top of each other — the consultant should know to align both left and right edges — only the left is aligned." `hero-actions` is a wrapping row (`layout: row, wrap: true`) of `hero-cta-primary` and `hero-cta-secondary`. When it wraps they stack, each as wide as its own words, so only their left edges line up.

## Root cause

- **No one knows where the subject is.** REQ-448's focal point exists and REQ-449's `cropped_subject` check uses it, but the hero video has no focal point, only an `objectPosition`. And no check looks the other way: whether something drawn **over** a picture covers its subject.
- **The alignment check accepts one shared edge.** `layout-check.ts`'s column alignment passes cells that share "a left edge, a right edge or a centre"; that suits text, but two stacked buttons sharing only a left edge read as ragged.

## What

1. **A picture or video with anything laid over it has a focal point.** When the consultant places a picture or clip into an overlay composition (`composition: overlay`, or anything `stacked` above it), it sets the focal point; it can see the picture, so it knows where the subject is. A builder write that lays text or a surface over a picture with no focal point is refused naming the picture: "give it a focal point first".
2. **A new layout check: `covered_subject`.** At each checked width, any text, button or painted surface (shading, scrim, filled box) drawn over a picture or video that covers the picture's focal point, or its subject region once mapped through `objectPosition`/the crop, is a finding. It's reported like the other layout findings, with the widths where it happens. The fix is to move the text, change where the picture is cropped, or change the layout, never to delete the shading the text needs to be readable.
3. **Stacked buttons line up on both edges.** When two or more buttons (`component: button.*`, or links styled as buttons) end up stacked in one column, at any width, because a row wrapped or a stack holds them, they share both left and right edges: all as wide as the widest, or all the column's width. The renderer makes a wrapped row of buttons do this at widths where it wraps (equal-width items when wrapped), and the layout check reports stacked buttons that share only one edge (`ragged_buttons`). The builder's priming says the same in one line.
4. **Fix Ariel's hero:** once deployed, the consultant's next look at the home page raises both findings, and the fix keeps the shading the text needs.

## What landed

### 1. A picture with anything laid over it has a focal point (`edit.ts`, `NO_FOCAL_POINT`)

- An AI write (`actor: 'ai'`, every builder write through the host) that lays something over a picture or clip with no focal point is refused `NO_FOCAL_POINT` (exit 9), naming the picture (its id, else its file) and saying "give it a focal point first"; nothing is written. The hint says to set `axes.objectPosition` to where the subject is.
- "Laid over" is read from the stored L1: the picture of a section with `composition: 'overlay'`; a picture beside a sibling marked `stacked: true` (a text box, a group, anything that is not itself a picture); and a box's own `axes.backgroundImageUrl` under children it holds.
- A focal point is the node's own `axes.objectPosition`, or the focal point its material carries ([[REQ-448]]), looked up by the picture's file name, and for a clip by its poster's file name too. The host lends the material focal points to AI writes (`focalPoints` in `aiOptions`, read from the library the same way the layout checker reads them).
- Like the other write rules (REQ-175, REQ-389), only an overlay **this write introduces** is refused: one the page already had is not this write's to answer for. A person editing their own site (the builder's own routes, the CLI) is not held to it.
- `NO_FOCAL_POINT` is declared on the builder's surface (`set_l1`, `add_page`, `copy_page`, `update_page`, `add_component`, `configure_component`, `add_section`) with its message.

### 2. `covered_subject` layout check

- New registry entry `covered_subject` (kind `covered_subject`). For each picture, clip or background picture of at least `minPicturePx` that has a focal point, the subject's place on screen is the focal point carried through the element's `object-fit` and `object-position` (`background-size`/`background-position` for a background). Where the page cannot read the picture's size (a clip not yet loaded, a background), the subject sits at the same share of the frame, which is exact for a picture framed on its own focal point.
- A 3×3 grid of samples round that point, `subjectShare` of the frame's shorter side apart. A sample is covered when text (its letters), a button, or a box painting a fill or gradient at least `minSurfaceAlpha` opaque is drawn over the picture there. A painted box over at least `wholeShare` of the picture is the picture's scrim, not a box on its subject (`cover` judges how much a scrim hides). The framework's own clip controls (the pause button) are not counted.
- More than `maxCoveredShare` of the samples covered is a finding, at each width where it happens, naming the outermost cover ("a shaded box holding …", a button, or the text), the picture and its focal point. The fix line says to move the text off the subject, frame the picture so its subject sits clear of the text (`objectPosition`), or change the layout, and to keep the shading the text needs.
- The focal points handed to the in-page check (`imageFocalPoints`) now include clips, under the clip's file and its poster's.

### 3. Stacked buttons share both edges

- **Renderer** (`render.ts`, `buttonRowDecls`): a container whose layout is `row` at every width, with `wrap: true`, holding two or more buttons (linked runs drawn as a box, which is what a `button.*` component resolves to) and sizing or placing nothing itself, is drawn `width: fit-content; max-width: 100%` with each button `flex-grow: 1`. On one line there is nothing to grow into, so every button keeps its own size; wrapped, each button takes the row's whole width, so stacked buttons share both edges (all the column's width). `distribution: center`/`end` keep the row where they put the buttons; a row spreading them (`between`/`around`) is left as it was.
- **New layout check `ragged_buttons`**: two buttons one above the other, at most `maxGapPx` apart, whose left and right edges are not both within `tolerancePx`, are a finding naming both, which edge they share (left only, right only, or neither), and their widths; the fix is to make stacked buttons the same width. Menu links and the framework's own controls are not counted.
- **`button_size` ([[BUG-293]]) adjusted:** buttons stacked at most `stackGapPx` apart that share both edges are measured against the widest label among them, so a column of buttons the width of its widest (or wider, up to `overLabel` times it) is not "a button stretched far larger than its label". Without this, the renderer change made Dina's wrapped "Get directions" (beside "Call (530) 555-0163") an `oversized_button` on a phone.
- **Builder priming** (both builder priming copies): before laying anything over a picture or clip, set its `objectPosition` to where its subject is and keep the text and its shading off that point; buttons stacked one above the other share both edges, all as wide as the widest or all their column's width.
- Both new kinds are craft kinds (`CRAFT_KINDS`, eval-builder) and their phrases join the critic's "checked elsewhere" list through `said`.

### 4. Ariel's hero

Not code: once deployed, the consultant's next look at Ariel's home page runs both checks. The hero clip already carries `objectPosition` 60%/35%, so `covered_subject` can judge it without a new focal point.

## Design decisions

- **Focal point = `objectPosition`, else the material's.** This is REQ-448/REQ-449's model (a node's `objectPosition` is its focal point for that placement). The refusal and the check read the same two sources.
- **Refuse only what the write introduces**, as every other write rule in `edit.ts` does, so an unrelated edit on a page with an old unframed overlay still lands.
- **"All the column's width" rather than "as wide as the widest" in the renderer.** CSS alone can stretch wrapped items to their line but cannot size them to the widest sibling without knowing where the row wraps; the ticket allows either. `button_size` is adjusted to agree.
- **A full-picture scrim is not a covering** for `covered_subject`: it is the shading the text needs, and the fix must never be to delete it.

## Test plan

`tests/test_UAT_FC_REQ-622_overlays_keep_off_the_subject.test.ts`:

- `test_UAT_FC_REQ-622_overlay_needs_focal_point`: through the builder's own toolbox writing as the AI, stacking a text box over a photo with no focal point is refused `NO_FOCAL_POINT` naming `hero-photo` and "give it a focal point first", and nothing is written; so is an `overlay` composition over the same photo; with `objectPosition` on the photo the write lands.
- `test_UAT_FC_REQ-622_overlay_focal_point_from_the_material`: the same write lands when the photo's material carries a focal point (lent by the host); a non-AI write is not held to the rule.
- `test_UAT_FC_REQ-622_covered_subject_found`: Ariel's hero as a fixture (a clip framed 60%/35%, a shaded text box over it) in real Chromium through `checkLayoutAt`: at phone width the box over the subject is `covered_subject`, naming the shaded box, the video and its focal point, and saying to keep the shading; a box kept to 480px on the left is clear at desktop; moved below the subject, no finding; with no `objectPosition` on the clip, its poster's material focal point is used.
- `test_UAT_FC_REQ-622_ragged_buttons_found`: two buttons in a column, each as wide as its words, are `ragged_buttons` ("lined up on their left edges only"); at equal width nothing is reported.
- `test_UAT_FC_REQ-622_stacked_buttons_share_both_edges`: a wrapping row of two buttons rendered by the real renderer: at 375px they stack with the same left and right edges; at 1280px they sit on one line, each its own width, 12px apart; and the layout check reports no `ragged_buttons`. (Fails on the previous renderer: right edges 67px apart.)

Regression run: every node suite importing the layout check, the priming, the L1 surface, the exit codes or the builder toolbox, plus suites rendering wrapping rows, BUG-293, REQ-389, and the workers suites for the priming budget (BUG-129), BUG-282, REQ-448, REQ-449 critic and REQ-474. Failures were all pre-existing on clean `xgd-working`: reconciliation AC1058/AC1095/AC1084/AC1333, BUG-237, BUG-276, REQ-175, REQ-349, REQ-361, REQ-415 clean page, REQ-418 (two), REQ-472 (two).