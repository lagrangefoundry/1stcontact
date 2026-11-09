---
uid: bug-a1e8ec7b
id: BUG-398
type: bug
title: 'Hero slideshow: a fading slide covers the overlay and lettering, and a clip
  slide''s still is the clip''s last frame, so every crossfade jumps'
created_by: EPIC-19
created_at: '2026-11-09T06:07:54.785109+00:00'
updated_at: '2026-11-09T14:48:37.172848+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-8d5826c8
  commits:
  - working_sha: c90a772316c6ad9d2c44f98dadb2582c69ecab40
    reconcile_sha: null
    main_sha: null
  - working_sha: 26b98ffe74bd521701f818416e90d0c96f35a998
    reconcile_sha: null
    main_sha: null
  version: 0.2.842
  story_points: 5
---

## Symptom

Found building a clip-carousel hero (REQ-664) on a client test site in production, 2026-11-08:

1. **The fading slide covers what's in front of the slideshow.** At the first crossfade, the incoming slide was drawn over the hero's dark overlay and its lettering (title, kicker, button). The lettering stayed hidden from then on, and the overlay vanished during every crossfade and came back when the clip started. The consultant reported it in production as PLATFORM_ISSUE-5, then got round it by raising the overlay's and the lettering's `paintOrder` one level at a time over three build rounds. A page author should never have to do that.
2. **Every crossfade landed on the wrong picture, then jumped.** Each slide's still was set to its clip's *last* frame. The crossfade landed on that still, then the clip started from its *first* frame, so the picture jumped. The operator diagnosed it; the consultant didn't.

## Root cause

1. **Stacking.** The slideshow runtime (`L1_SLIDESHOW_SCRIPT`, `packages/framework/src/l1/render.ts`, `advance()`) sets `z-index: 2` on the incoming slide and `1` on the others. The slideshow root sets no stacking context of its own (it has `position: relative; overflow: hidden` but no `isolation`), so those slide z-indexes compete with the slideshow's *siblings* in the hero container. An overlay at `paintOrder` 1 (`z-index: 1`) or no paintOrder (`auto`) loses to the fading slide.
2. **The still.** The clip tool (`apps/control-app/src/videogen.ts`) files only the clip's **last frame** as its picture material (`poster`), and its guidance says to use that as the video's poster. In a slideshow the slide's `image` is what the crossfade lands on before the clip plays (`shown()` → `play()`: the clip starts after the fade, from frame one). So the slide's still has to be the clip's *first* frame, which for a clip made from a photo is that source photo. Nothing records which photo a clip was made from, and nothing checks the pairing. The same guidance also tells the consultant to make slideshow clips as out-and-back loops ("the camera moves out and comes back"). REQ-664's own design says a slideshow clip doesn't need to come back, because the fade hides its end. That loop rule is what made the clips fast and bent their final frames.

## Expected behaviour

1. **Nothing in front of a slideshow is ever covered by it.** The slideshow is its own stacking context (`isolation: isolate` on its root), so its slides' z-indexes only order the slides among themselves. An overlay, text or button placed after the slideshow in the same container stays in front through every crossfade and every clip, on every width, with no `paintOrder` set by the page. The same applies to any media node whose runtime layers its own children (the REQ-461/470 video's two layers).
2. **A clip slide's still is its clip's first frame, by construction.**
   - The clip tool records on the clip material the photo it was made from (its first frame), alongside the existing last-frame poster.
   - When a slide's `video` is a clip with a recorded source photo, the slide's `image` is that photo. A slide that pairs the clip with any other still (including the clip's last frame) is refused on write, with a message naming the photo to use. Where the host builds the slide itself, it fills the photo in.
   - Clips with no recorded source (uploaded by the client) keep today's behaviour: the slide's still is whatever was given.
3. **The crossfade is seamless both ways.** The outgoing slide fades from its clip's last frame (as now) and the incoming slide fades in on its clip's first frame, then plays from there. No jump at either end.
4. **Slideshow clips are one-way.** The clip tool's guidance for a slideshow says: one direction, a small slow move, starting on the slide's photo, with no requirement to return to it. Out-and-back loops and ping-pong stay available for a single hero video, or when the client asks for them.
5. **Existing sites recover without edits.** A site whose overlay and lettering were raised with `paintOrder` as a workaround still renders correctly.

## What changed

1. **The slideshow is its own stacking context.** The rendered slideshow root carries `isolation: isolate` (`packages/framework/src/l1/render.ts`), so the runtime's slide `z-index` (2 incoming, 1 the rest) only orders slides among themselves. A shade or lettering laid after the slideshow stays in front through every crossfade and clip, with or without `paintOrder`. The wrapped hero video (REQ-461/470/649: poster picture + clip layered in one box) is isolated the same way. A site that raised its overlay and lettering with `paintOrder` as a workaround still renders the same.
2. **A made clip records the picture it opens on.** The clip tool (`apps/control-app/src/videogen.ts`) writes `first_frame` on the clip material: the material id of the photo it was made from (`image`), or of a reveal's `start_image`. A name given as an attachment resolves to the material it hangs off. The tool's result carries `first_frame` too. `poster` stays as it was (the clip's last frame). The field is declared in `tickets.ts`, read onto `MaterialRow` and the consultant's Library item (`CatalogueItem.first_frame`).
3. **The page write pairs a clip slide with its first frame.** The host lends AI writes `clipStills` (`aiOptions` in `host-core.ts`, read off the Library): for each made clip placed on the site, by its file name, the photo it opens on (Library label) and that photo's file names on this site. The write gate (`settleClipStills` in `tools/generate/src/cli/edit.ts`, run inside `validateOrThrow`, so every write path) then, for each slideshow slide whose `video` is such a clip:
   - leaves out `image` (or gives it empty): the photo's site file is **filled in**, addressed beside the clip, when the photo is on the site;
   - names any other still (for example the clip's last-frame poster): **refused** with the new code `WRONG_STILL`, the message naming the slide, the clip, the photo's label and its site file (or saying to place it first);
   - a pairing the page already had is not this write's to answer for (REQ-175's rule).
   Clips the host knows nothing of (uploaded by the client) keep whatever still they are given. `WRONG_STILL` is declared in `errors.ts` (exit code 10) and on the L1 surface's write operations beside `NO_FOCAL_POINT`.
4. **Slideshow clips are one-way.** The clip tool's guidance now says: for a carousel of clips make each with `mode: 'free'` from the slide's photo, one small slow move in one direction starting on the photo, with no need to come back because the fade hides its end; a slide's `image` is its clip's first frame (`first_frame`), never its last; leave it out and it is filled in; out-and-back loops and pingpong are for a single hero clip or when the client asks. The slideshow schema's comments say the same.
5. **The crossfade is seamless both ways** with the runtime unchanged: the outgoing slide fades from its clip's last frame (its clip stays shown through the fade), and the incoming slide fades in on its still, which is now its clip's first frame, then plays from frame one.

## Design decisions

- **Explicit supersession of REQ-664's slideshow guidance.** REQ-664 told the consultant to make slideshow clips as `loop` with "the slide's photo as its first and last frame", out and back. This ticket replaces that with one-way `free` clips; `test_UAT_FC_REQ-664_slideshow_guidance` was updated to stop pinning the old wording.
- **Isolation, not reordering.** Ordering slides by DOM moves instead of `z-index` was considered and rejected: moving a node holding a `<video>` pauses it. Isolation is one declaration and also covers the still-only (CSS) path.
- **Known consequence:** the slideshow's pause button (REQ-471) is now inside the slideshow's stacking context, so a box laid over the slideshow's bottom-right corner paints over the button and takes its clicks. Before this fix, a fading slide covered the same overlay instead. It's still reachable by keyboard.
- **The fill-in is the "host builds the slide" path.** Nothing else in the host builds clip slides (the capture fold builds still slideshows from other sites, with no clip material), so leaving `image` out on a write is how a slide gets its photo filled in.
- **The check is lent only to AI writes** (as REQ-622's focal points are). An owner editing their own site through the builder routes isn't held to it.

## Test plan (as built)

- `tests/test_UAT_FC_BUG-398_slideshow_stacking_in_a_browser.test.ts` (Chromium, real renderer and runtime, screenshots decoded and sampled):
  - `..._shade_and_lettering_stay_in_front_through_every_crossfade`: a hero with a 3-clip slideshow, then a black shade and white lettering placed over it with no `paintOrder`. The slideshow root computes `isolation: isolate`. Every frame through the first and second crossfades has the shade black and the lettering white, while all three slide colours show through on the right. Fails on the old renderer (the shade is covered mid-fade).
  - `..._a_hero_raised_with_paint_order_as_a_workaround_still_renders`: the same with the shade at `paintOrder` 2 and the lettering at 3.
  - `..._the_crossfade_lands_on_the_incoming_clips_first_frame`: two one-way clips whose stills are their first frames. The frame at the end of the fade, before the clip shows, is the still, and the first frame after the clip shows is the same colour (no jump). The outgoing slide faded out from its clip's last frame.
- `tests/test_UAT_FC_BUG-398_clip_slide_still_is_its_first_frame.test.ts` (builder toolbox `set_l1` as the AI, real site):
  - `..._a_clip_slide_over_another_still_is_refused_naming_the_photo`: the last-frame poster as still is refused `WRONG_STILL`, naming the slide, `IMAGE-3` and `'ring.png'`, with nothing written. The source photo is accepted. An uploaded clip's still is untouched.
  - `..._a_clip_slide_with_no_still_has_its_first_frame_filled_in`: `image` left out is filled with `assets/ring.png`. With the photo not placed, refused, saying to place it.
- `tests/test_UAT_FC_BUG-398_clip_records_its_first_frame.workers.test.ts` (real clip plugin, D1 store, Library; fal faked):
  - `..._a_made_clip_records_its_source_photo_as_its_first_frame`: by attachment id → the photo material; a reveal → its start picture; on the Library row and the consultant's Library item; distinct from `poster`; null on a non-clip.
  - `..._the_host_lends_each_placed_clip_the_photo_it_opens_on`: `aiOptions(...).clipStills()` maps the clip's site file to the photo's label and its site files (this site's only).
  - `..._slideshow_clips_are_one_way_and_start_on_the_slides_photo`: the guidance wording above, and no "first and last frame".
- Regression scope run: REQ-664/461/470/471/649/622/126/175/448/389/254, BUG-48/351/355/356/365 node and workers suites. Two failures (`BUG-48_every_stated_rule…`, `REQ_175_naming_one_document_key…`) fail identically on clean xgd-working, so they predate this ticket.