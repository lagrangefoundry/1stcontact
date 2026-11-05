---
uid: request-3aafb366
id: REQ-649
type: request
title: 'Site render: hero video loads after the page — poster first, clip deferred,
  skipped on slow or data-saving connections'
created_by: EPIC-19
created_at: '2026-11-04T23:14:01.928030+00:00'
updated_at: '2026-11-05T00:26:31.522034+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3c6b9f82
  commits:
  - working_sha: da8f1cfc77753cb6fad74fa12cff31b7f6b2fc19
    reconcile_sha: null
    main_sha: null
  - working_sha: 21489f3dc33700333548adde05ca984e524a003c
    reconcile_sha: null
    main_sha: null
  version: 0.2.769
  story_points: 5
---

## Why

A clip that keeps moving by itself (a hero made with AnimateImage: a loop, a pingpong, a loop that rests between plays, or an intro that hands over to a loop) is driven by `L1_VIDEO_SCRIPT` (`packages/framework/src/l1/render.ts`). Since REQ-471 its HTML already carries no `autoplay` and `preload="none"`, but the runtime calls `play()` on `DOMContentLoaded`, so the browser starts downloading the whole clip (up to the 2,000,000-byte budget) before the page's `load` event, alongside the hero image, fonts and CSS. On a slow phone connection (~400 kbps effective) 2 MB is around 40 s of transfer, competing with what the visitor needs to see first. The poster is a `poster=` attribute: fetched at low priority and never a sized image rendition.

This ticket changes the runtime's start condition and how the poster is served, in the renderer, so every site gets it without the consultant doing anything.

## What the visitor gets

Applies to clips that keep moving by themselves (loop, pingpong, resting loop, intro→loop). Play-once reveals keep today's behaviour (see Decisions 1).

1. **The first frame shows straight away, as an image.** The clip's poster is a renderer-owned `<img>` carrying the image ladder's renditions (`srcset`/`sizes`) when the publish built one. For a clip in the page's first top-level section the `<img>` has `fetchpriority="high"` and the page head carries `<link rel="preload" as="image" … imagesrcset … imagesizes … fetchpriority="high">` for it (a new renderer output for `<head>` links, placed by `tools/generate`). The image and the `<video>` share one box sized by the node: the video lies exactly over the image. The poster is the clip's first frame for every clip in scope.
2. **Then the rest of the first screen.** No `autoplay`, and `preload="none"`, in the HTML; the runtime requests nothing during the initial load.
3. **Then the clip.** After the page's `load` event, when the browser is idle (`requestIdleCallback`, with a timeout fallback where it is missing), the runtime requests the clip. The video stays invisible until `canplaythrough`; it then starts from frame 0 and fades in over the poster, with no layout shift. A clip below the first section is only requested once it nears the viewport (IntersectionObserver with a margin).
4. **No clip download when it would hurt.** The poster stays and the clip is never requested when:
   - `navigator.connection.saveData` is true;
   - `navigator.connection.effectiveType` is `slow-2g`, `2g` or `3g`;
   - the visitor prefers reduced motion (`prefers-reduced-motion: reduce`);
   - no script runs.
   Where `navigator.connection` doesn't exist (Safari, Firefox) only the motion preference is checked.
5. ~~Phones get a smaller clip~~ — removed; moved to lagrange-framework REQ-237 (Decisions 2).

Capture still reads the clip back as one `video` node: the poster `<img>` and the wrapper are `data-fc-invariant`. The pause button (REQ-471) and the intro→loop handover (BUG-305) keep working on the deferred clip. The edit render keeps showing the poster only, as today.

## Not in scope

- Encoding size and bitrate, a smaller phone rendition and a first-frame still for reveals: lagrange-framework REQ-237.
- Play-once reveals, and hover clips (already fetch nothing before the first hover), except where they share the poster image.

## Test plan

`test_UAT_FC_REQ-649_*` (render output, plus Chromium under `--single-process`):
- **HTML:** a looping hero clip renders with no `autoplay`, `preload="none"`, a poster `<img>` with the ladder's `srcset`/`sizes`, `fetchpriority="high"` and a head preload link when the clip is in the first section; neither when it is further down. A play-once reveal is unchanged.
- **Capture round trip:** capture of the rendered clip yields one `video` node with its `src` and `poster`.
- **Order:** on a page load, no request for the clip's file starts before the page's `load` event.
- **Hand-over:** after load and idle, the clip is fetched, plays from frame 0, is shown over the poster, and the box doesn't move.
- **Skips:** with `saveData` on, with `effectiveType` 3g, and with reduced motion, the clip is never requested and the poster stays.
- **No script:** the poster shows and the clip is never fetched.
- **Below the fold:** a clip further down the page isn't requested until it nears the viewport.

## Decisions on the session's questions (EPIC-19, 2026-11-04)

Answers to the four questions in this ticket's chat (comment-3c6b9f82). The session's correction stands: since REQ-471, plain loops already render `preload="none"` with no `autoplay`, and the early fetch comes from `L1_VIDEO_SCRIPT` calling `play()` on `DOMContentLoaded`. Update **Why** accordingly. The fix is the runtime's start condition plus the poster work.

1. **Scope: only clips that keep moving by themselves are deferred.** That means plain loops (including pingpong), loops that rest between plays, and intros that hand over to a loop: the clips whose poster already matches frame 0. **Play-once reveals keep today's behaviour** (`autoplay preload="auto"`, the REQ-461 test unchanged). A reveal's poster is its last frame, so deferring it would show the end state, then jump back to frame 0. Reveals are deferred later, once videogen supplies a first-frame still, which is added to lagrange-framework REQ-237's scope. When that lands, a follow-up extends this behaviour to reveals.
2. **Item 5 (the smaller phone clip) is removed from this ticket.** Videogen keeps one encoding. An optional 540p rendition is added to lagrange-framework REQ-237's scope, since it is the same ladder work. Don't render `<source media>` markup for a file that doesn't exist. The `<source media>` wiring is a small follow-up once REQ-237 provides the rendition. Drop item 5's test from the test plan.
3. **The poster structure is approved as proposed:**
   - a renderer-owned `<img>` with the image ladder's `srcset`/`sizes`;
   - `fetchpriority="high"`, plus a `<link rel="preload" as="image" imagesrcset … imagesizes …>` when the clip is in the first section;
   - the `<video>` laid exactly over the image, invisible until `canplaythrough`, then faded in;
   - the `<img>` and its wrapper marked `data-fc-invariant`, so capture still reads back one `video` node and the round-trip check holds;
   - a small new renderer output for `<head>` links, which `tools/generate` places in the page head;
   - with no script, or when a skip condition applies, only the image ever shows.

   One addition: the fade must not shift the layout, so the image and video share one box sized by the node, and the test asserts no layout shift.
4. **Agreed as stated:** "first screen" means the page's first top-level section. The connection checks use `navigator.connection` where it exists (Chromium). Safari and Firefox visitors get the clip after the page loads unless they prefer reduced motion. That's acceptable; don't guess at other signals.


## Implementation notes (as landed, da8f1cfc + 21489f3d)

- **Markup** (`packages/framework/src/l1/render.ts`, `clipOf`/`videoHtml`): a deferred clip with a poster is `<span class=node>` (the node's box: sizing, surface, `position: relative`, `overflow: hidden`, `width: fit-content` where nothing sets a width) holding `<video class="l1-video" … preload="none" data-l1-video-defer>` (absolute, filling the box, no `poster=`), the REQ-471 pause button, and `<img data-fc-invariant data-l1-video-poster …>` (in flow, on top, `pointer-events: none`, ladder `srcset`/`sizes`, `width`/`height` from the manifest; `fetchpriority="high"` in the first section, `loading="lazy"` elsewhere). A deferred clip with no poster keeps the bare `<video>` and is still deferred by the runtime.
- **Differs from Decisions 3:** only the `<img>` is `data-fc-invariant`, not the wrapper — capture skips an invariant element's whole subtree, so marking the wrapper would hide the clip. Capture (`extract.ts` `videoOf`) reads the poster off the `<img data-l1-video-poster>` beside the clip.
- `sizes` (and `imagesizes` on the preload) is the renderer's own `imageSizes` answer; where it can't name a width (a fill width with no cap) it is omitted, as for every picture, and the browser assumes the viewport.
- **Head:** `renderL1Document` returns `head` (the preload links); `tools/generate`'s page head places it. "First section" = the render root's first child (`path[1] === 0`).
- **Runtime** (`L1_VIDEO_SCRIPT`): a `data-l1-video-defer` clip on `saveData` / `slow-2g`/`2g`/`3g` is not armed at all (pause button stays hidden). Otherwise: after `load` → `requestIdleCallback` (2 s timeout; `setTimeout` 200 ms where missing) → IntersectionObserver with a 200 px margin → `preload='auto'; load()` → on `canplaythrough`, `currentTime = 0` and the existing start path (in-view trigger, session replay, intro staging all unchanged) → on `playing` the box gets `l1-video-on`, which fades the picture out over 400 ms.
- **Other tickets' runtime UATs** (REQ-461, REQ-470, REQ-471 jsdom harnesses) now wait for load + idle and fire `canplaythrough` before asserting, since a clip that keeps moving no longer plays at `DOMContentLoaded` (supersedes that part of their behaviour). REQ-470's harness counts `load()` calls from after the deferred fetch.
- Regression scope run: all video suites (REQ-461/470/471, BUG-305, BUG-330, REQ-622), REQ-222 ladder, BUG-80, REQ-82 envelope, REQ-400/422 — green. BUG-48 fails identically on clean xgd-working (pre-existing).