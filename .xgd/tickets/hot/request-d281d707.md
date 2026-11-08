---
uid: request-d281d707
id: REQ-664
type: request
title: 'Hero slideshow: cross-fading stills and clip carousels'
created_by: EPIC-26
created_at: '2026-11-07T20:41:57.395194+00:00'
updated_at: '2026-11-07T22:22:00.673098+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-2a432012
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d12ddfcd
  commits:
  - working_sha: 7e0013da835658610f661bb176c5a8bad2f7fa23
    reconcile_sha: null
    main_sha: null
  - working_sha: caa506feefca0f302cb19c86263854fa4b3f3f78
    reconcile_sha: null
    main_sha: null
  version: 0.2.817
  story_points: 8
---

## Intent

A hero **slideshow**: a typed L1 node holding an ordered list of slides. Each slide is a still photo or a short clip, and the slides cross-fade one into the next, then loop. It covers two needs:

- **Fading stills.** Many small businesses already have a slideshow of fading photos, often from a WordPress slider plugin. When we rebuild their site, they shouldn't lose it.
- **A carousel of clips.** Each clip opens on its slide's photo, does its motion (for example a slow pan around a product), and ends on that same photo. That still then fades into the next slide's photo, which plays its own clip, and after the last slide it starts again.

The stills fallback is the clip carousel with the motion removed. Whenever motion can't play (reduced motion, no script, a clip that hasn't loaded), visitors see the slides' photos fading in turn. That's the DOC-72 test 4: the site still works if the motion never plays. It's also why the two needs are one node rather than two.

Operator decisions (2026-11-07, EPIC-26):
- one ticket covering both needs;
- **no ping-pong for clips in a slideshow**. The fade to the next slide hides the end of each clip, so a clip doesn't have to play backwards to loop. Ping-pong stays available when a client asks for it. It's still the default for a single pan-style loop on its own.

## Behaviour

- **Slides:** an ordered list with at least 2 entries and a structural cap (for example ≤ 8). Each slide has:
  - `image` (required): its still photo, which is the poster and the fallback;
  - `video` (optional): an `.mp4`/`.webm` clip that should start and end on that photo.

  Both `src`s pass the same URL-scheme allowlist as image and video. The same fit/zoom axes as image apply.
- **Timing:**
  - `holdMs` is how long a still slide is shown, bounded (for example 2–15 s).
  - `fadeMs` is the cross-fade length, bounded (for example 300–4000 ms). Its default is about 1 s, not the 3–4 s many slider plugins use.
  - A clip slide is shown for as long as its clip runs, and the fade into the next slide starts when the clip ends.
- **Progressive start:**
  - The first slide's photo loads straight away, because it's the hero's largest image.
  - Slide 1's clip starts as soon as it can play, without waiting for the others.
  - The next slide's clip is fetched while the current one plays, and later clips aren't fetched before then.
  - If a clip isn't ready when its slide comes up, that slide shows its still for `holdMs` and the slideshow carries on. It never stalls on a spinner.
- **Still-only slideshows** run in CSS alone, with no script.
- **Clip slideshows** reuse the REQ-461/470 video runtime: two stacked layers, with the next slide fading in over the current one when the current clip ends.
- **Reduced motion:** the first slide's photo only. No fading and no clips.
- **Without script:** a clip slideshow shows its slides' photos fading, just like a still-only slideshow.
- **Pause (WCAG 2.2.2):** a slideshow advances by itself for more than 5 s, so it gets the REQ-471 pause button, with the same placement, hover/focus, touch and accessible-name rules. Pausing freezes the current frame or still and stops it advancing for the rest of the page view.
- **No visitor navigation in this ticket:** no arrows, dots or swipe. That matches the common slider setup.
- **Motion budget:** a slideshow counts as the page's one signature motion (DOC-72), the same as a hero loop.
- **Typed, not configurable:** a new `.strict()` node next to `image`/`video`. Unknown keys are rejected, as are unsafe URLs, out-of-range timings and too many slides. Muted and `playsinline` are always on. No raw HTML or CSS comes from instance data (Security Policy). `capture(render(L1)) ≈ L1` must hold.

## Consultant / builder guidance (short; the priming budget is tight)

- Offer a slideshow when a client already has one, or has several hero-worthy photos.
- Clips in one slideshow should share one motion language: the same kind of camera move, speed and light (DOC-72 test 3).
- To make each clip, use first-and-last-frame mode, with the slide's photo as both the first and the last frame. The camera moves out and comes back in one continuous move, not by reversing.

## Why free-coded

The work extends the existing `video` node work (REQ-461/470/471) and has a bounded scope.

## Test plan (UATs named `test_UAT_FC_<this ticket>_*`)

- **Validation:** the schema accepts a valid slideshow. It rejects:
  - unknown keys;
  - unsafe `image`/`video` URLs;
  - fewer than 2 slides, or more than the cap;
  - `holdMs` or `fadeMs` out of range.
- **Still-only render:** the photos fade in order, with no script. Only the first photo is loaded eagerly. Reduced motion shows the first photo only.
- **Clip slideshow (browser):**
  - slide 1's clip plays before the later clips are fetched;
  - when it ends, slide 2 fades in;
  - a clip that fails to load falls back to its still for `holdMs`, and the slideshow carries on;
  - after the last slide, it loops back to slide 1.
- **Pause:** the button shows on hover and on focus. Pressing it freezes the slideshow, which then stops advancing. A still-only slideshow gets the button too.
- **Round-trip:** `capture(render(L1)) ≈ L1` for still and clip slideshows. Capture ignores the pause button and the fallback layers.
- **Security envelope:** injection payloads in slide URLs are inert, following the REQ-82 pattern.


## What landed (free-coded, 2026-11-07)

**Node** (`packages/site-schema/src/l1/schema.ts`): `slideshow`, `.strict()`, beside `image`/`video`.
- `slides`: 2–8 entries, each `{ image, alt, video? }` (also `.strict()`). `alt` is per slide, as on an `image`: empty means decorative. It's needed because each photo is its own picture.
- `holdMs`: 2000–15000, default 5000 when absent. `fadeMs`: 300–4000, default 1000 when absent. An absent timing isn't written into the markup, so capture reads it back as absent.
- `aspect` and `axes` (`objectFit`, `objectPosition`, the surface) as on `image`, shared by every slide, plus the shared node axis groups. "Zoom" in the Behaviour section is read as these framing axes. The magnify role (`zoom`) isn't on the slideshow.
- No `muted`, `controls`, `autoplay`, arrows or dots fields exist, so none can be set.

**Validation** (`validate.ts`): `L1_ENVELOPE.slideshowSlides/slideshowHoldMs/slideshowFadeMs`. Each slide `image` and `video` passes the URL allowlist, and a slide `video` must be `.mp4`/`.webm` (new structural rule `slideVideoIsAClip`). `l1AssetReferences` reports every slide photo and clip, and asset mirroring (`tools/generate/src/l1/assets.ts`) resolves them like a video's files.

**Render** (`packages/framework/src/l1/render.ts`): the node's box holds one `<span class="l1-slide">` per slide, stacked, then REQ-471's pause button.
- Slide 1's photo is eager: `fetchpriority="high"`, plus a `<head>` preload when it's in the first section. Later photos are `loading="lazy"`.
- A clip is a `<video muted playsinline preload="none" aria-hidden>` laid over its photo, with **no source in the markup**. Only the runtime gives it one, so no clip is fetched without script, under reduced motion, or before its turn.
- **Still-only fades are CSS**: one `@keyframes` per later slide, behind `(prefers-reduced-motion: no-preference)`. Slide 1 never moves. Each later slide fades in over the one before. At the end of the cycle the hidden slides drop out under the last one, and the last fades out to slide 1, so only neighbouring photos ever mix.
- Under reduced motion every slide but the first is `display: none`, so the later photos aren't fetched either.
- The edit render shows the photos with no motion, no script and no button.

**Runtime** (`L1_SLIDESHOW_SCRIPT`, exported beside `L1_VIDEO_SCRIPT` for CSP hashing): returns at once under reduced motion. It always arms the pause button. It runs the fades itself only for a slideshow with clips, using the REQ-470 approach (stacked layers, the next slide fading in over the current one).
- Slide 1's clip is fetched at start and plays as soon as it can. The next slide's clip is fetched once the current one is playing (or once a still slide comes up), never earlier.
- A clip that isn't playable when its slide comes up (still loading, or failed) leaves the slide a still for `holdMs`, and the slideshow carries on.
- On save-data or a 3g-or-slower connection, no clip is fetched and the photos fade as for stills.

**Pause**: the REQ-471 button and look, in the slideshow's bottom-right corner. It's shown on hover or focus, faint where nothing can hover, and labelled "Pause slideshow" / "Play slideshow". Pausing freezes the CSS animation (stills) or the playing clip, and nothing advances until Play.

**Capture/fold**: later slides, every clip and the button are `data-fc-invariant`. Capture reads one picture, the first photo, and reads the slides and timings off the box (`CapturedSlideshow`). The fold rebuilds the `slideshow` node.

**Consultant guidance** (the clip operation's description in `apps/control-app/src/videogen.ts`, read with the tool rather than primed): offer a slideshow for a client's existing slider or several hero-worthy photos; it's the page's one hero. Make each clip with `mode: 'loop'`, the slide's photo as both first and last frame, in one continuous move (not a pingpong), with one kind of camera move, speed and light across the slideshow.

**Also touched**: `test_UAT_FC_BUG-48_the_reference_covers_its_source` gets a case provoking `slideVideoIsAClip`, since every structural rule must be provoked there. That suite's `every_stated_rule…` test was already red on clean xgd-working (an unrelated rule).

**Not in scope**: visitor navigation (arrows, dots, swipe); folding third-party sliders from a live capture (only our own render round-trips); BUG-355's overlay-hero composition (`design.ts` treats only `image`/`video` as the overlay picture).

## UATs

- `tests/test_UAT_FC_REQ-664_slideshow_node.test.ts`: validation accepts and refuses, asset references, injection inert, still and clip markup, defaults, edit render.
- `tests/test_UAT_FC_REQ-664_slideshow_in_a_browser.test.ts` (Chromium, clips recorded in the page as WebM):
  - no-script CSS fade order;
  - reduced motion: first photo only, nothing else fetched;
  - clip carousel: progressive fetch, ended → next fades in, failed clip falls back for `holdMs`, loops back;
  - pause on stills and clips;
  - capture round-trip for still and clip slideshows.
- `tests/test_UAT_FC_REQ-664_slideshow_guidance.workers.test.ts`: the consultant guidance.