---
uid: request-9c9650ab
id: REQ-470
type: request
title: 'Hero clips: intro-then-loop sequences and hover-to-play (in-view once on touch)'
created_by: EPIC-26
created_at: '2026-10-26T19:13:14.921841+00:00'
updated_at: '2026-10-26T20:22:22.392543+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-2a432012
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-22986e18
  commits:
  - working_sha: d6598bdf68c5ee6cd9e04d6efe0b539667e37178
    reconcile_sha: null
    main_sha: null
  - working_sha: 31482444fd74cf7ce1b58c6c28dd993c87c28b9e
    reconcile_sha: null
    main_sha: null
  version: 0.2.671
  story_points: 5
---

## Intent

Two follow-on requests from the EPIC-26 pilots. Both extend the as-built REQ-461 `video` L1 node and the consultant's clip guidance. Neither needs a change to the LF `ai_videogen` component (lagrange-framework REQ-220).

### 1. Intro then loop (Dina's Diner)

The consultant offered Dina "a pepper grinder **or** a looping steaming coffee". The operator wanted **both**: the grinder reveal plays first, then a subtle steam loop runs from then on.

- **Page behaviour:** the visitor sees the reveal play once (grinder comes in, peppers the eggs, ends on the real photo). From that last frame, the steam rising off the coffee loops seamlessly and keeps looping. There is no visible jump where the reveal hands over to the loop.
- **Why the join is seamless:** the reveal already ends on the original photo (EPIC-26 §"Reveal"), and a `loop` clip uses the original photo as its first and last frame. Both clips meet on the same frame.
- **Typed L1, not a script:** one `video` node carries the intro and the loop: an optional `loopSrc` (same `.mp4`/`.webm` URL allowlist as `src`), with `src` being the intro. `playback` describes the intro (`once`); with `loopSrc` present the node rests on the loop instead of the last frame. `restMs` applies to the loop part. Unknown keys stay rejected (REQ-82).
- **Replay:** `replay: once_per_session` skips the intro on a repeat view in the same browsing session and goes straight into the loop. `every_visit` plays the intro every time.
- **Reduced motion:** the poster only, and neither clip is fetched (unchanged REQ-461 rule).
- **Consultant guidance:** when two proposed motions are compatible (a one-off reveal and a subtle ambient loop on the same photo), the consultant can offer them **together** as intro-then-loop instead of as an either/or choice. It still agrees the design with the client (what moves, the order, how long), per REQ-468. The clip tool is called twice: a `reveal` and a `loop`, both from the same source photo.

### 2. Hover to play, in view once on touch (Lagrange Foundry)

The operator wants Lagrange Foundry's illustrations to move as clips, but **only when the mouse is over them**. On a phone, where there is no hover, each one plays **once when it scrolls into view**.

- **New trigger value `hover`** on the `video` node (`trigger: load | in-view | hover`), the same name the REQ-335 animate tracks already use.
- **With a mouse (a device that can hover):** the illustration shows its poster at rest. Pointer enters: the clip plays from the start. Pointer leaves: the clip stops and goes back to the poster. A `loop` clip loops while the pointer stays over it. A `once` clip plays through once per hover and rests on its last frame until the pointer leaves.
- **On touch (no hover available, decided by the `(hover: none)` media query, not by sniffing the user agent):** a `hover` clip behaves as `in-view` + `once`. It plays one pass the first time it scrolls into view, then rests on its last frame. It does not replay on scrolling back.
- **Keyboard:** a focusable ancestor (for example the card's link) receiving focus counts as hover, so keyboard users get the same motion.
- **Loading:** a `hover` clip isn't downloaded until it's first needed (pointer near it, or in view on touch), so a page with several illustrations doesn't fetch every clip up front. The poster shows until then.
- **Reduced motion:** the poster only, as for every clip.
- **Consultant guidance:** for illustrations and secondary images (not the hero), hover-to-play is the recommended trigger, because several looping illustrations on one page is too much movement. The existing "at most one ambient hero clip per page" rule is unchanged. Hover clips don't count towards it.

## Open decision (default chosen, operator can override)

- **Pointer leaves a hover clip:** default is stop and return to the poster. The alternative is to let the current play finish and then rest. The default keeps the page still once the mouse has moved on.

## Test plan (UATs named `test_UAT_FC_<REQ-ID>_*`)

- Schema: `loopSrc` accepted with a safe URL, rejected for `javascript:`/`data:` (REQ-82 envelope). `trigger: 'hover'` accepted; an unknown trigger still rejected.
- Render + capture round-trip (`capture(render(L1)) ≈ L1`) for a node with `loopSrc`, and for one with `trigger: 'hover'`.
- Runtime (jsdom or Chromium): the intro's `ended` starts the loop clip, which loops; with `once_per_session` set and the session key present, the loop starts without the intro.
- Runtime: under `(hover: none)` a `hover` clip plays once on intersection and doesn't replay; with hover available it plays on pointerenter and returns to the poster on pointerleave; no clip request before first need.
- Reduced motion: neither `src` nor `loopSrc` is fetched.
- Consultant priming/guidance: names intro-then-loop as an option alongside either/or, and hover as the trigger for illustrations. Keep it to op-summary text (BUG-129 priming budget).

## Pilot

- Dina's Diner: generate the steam loop from the steak-and-eggs photo and place it as `loopSrc` after the existing pepper reveal on dev.
- Lagrange Foundry: generate clips for the illustrations and place them with `trigger: 'hover'`. Check on desktop and with a phone-sized touch emulation.


## As built (free-coded)

**L1 `video` node** (`packages/site-schema/src/l1/schema.ts`, `validate.ts`):
- `loopSrc?: string` — same URL allowlist and `.mp4`/`.webm` rule as `src`; a referenced asset like `src`/`poster` (asset resolution + `l1AssetReferences`). Allowed only with `playback: 'once'` (new rule `loopSrcNeedsOnce`).
- `restMs` now applies to a node that loops: `playback: 'loop'`, **or** a `once` with `loopSrc` (the rest is between plays of the loop part).
- `trigger: 'load' | 'in-view' | 'hover'`. A `hover` clip takes neither `loopSrc` nor `replay` (new rule `hoverPlaysAlone`): it plays once per hover, so there is no intro to hand over from and no session to remember. An unknown trigger is still rejected; unknown keys stay rejected (REQ-82).

**Renderer + runtime** (`packages/framework/src/l1/render.ts`, `L1_VIDEO_SCRIPT`):
- One `<video>` element carries both clips. Only the intro is a `<source>` (gated on `prefers-reduced-motion: no-preference`); the loop is a `data-l1-video-loop` attribute the runtime reads. At the intro's `ended` the runtime points the same `<source>` at the loop, `load()`s and plays it, looping natively (or resting `restMs` between plays). The poster — the frame both clips meet on — is what the element shows while the loop loads, so the join does not jump. No second element, no change to framing/geometry.
- `replay: once_per_session` + `loopSrc`: a repeat view in the session skips the intro and starts the loop. `every_visit` plays the intro each time.
- Hover: the clip carries `preload="none"`, no `autoplay`, and its poster, so nothing is fetched until the first hover. The hover target is the clip's nearest focusable ancestor (`a[href]`, `button`, `[tabindex]` — e.g. the card's link) or the clip itself. `pointerenter`/`focusin` play from the start (a `loop` clip loops, a `once` clip rests on its last frame); `pointerleave`/`focusout` pause and `load()` the element, which returns it to the poster (the open decision's default). "First needed" is the first hover/focus; no separate near-pointer prefetch.
- Where `(hover: none)` matches, a `hover` clip becomes in-view + once: one pass the first time it intersects, loop and rest switched off, no replay on scrolling back, pointer events ignored.
- Reduced motion: the runtime returns before arming anything, so neither `src` nor `loopSrc` is fetched; a page without script shows the poster.
- The runtime ships only when some clip needs it (now also for `loopSrc` and `hover`).

**Capture + fold** (`tools/generate/src/cli/capture/extract.ts`, `types.ts`, `l1/fold.ts`): capture reads `data-l1-video-loop` (resolved absolute) and `trigger="hover"`; the fold restores `loopSrc` (as a `once` whose `restMs` is the loop's) and `trigger: 'hover'`, so `capture(render(L1)) ≈ L1` holds for both.

**Consultant guidance** (`apps/control-app/src/videogen.ts`): kept in the `animate_image` op description (not primed, BUG-129). It now says illustrations and secondary pictures move only on hover (once in view on a phone), hover clips don't count towards the one-hero rule, two compatible ideas (a reveal and a subtle loop) can be offered together instead of either/or, made as a `reveal` and a `loop` from the same photo and placed as `src` + `loopSrc` on one `video` element, and the client agrees the design including the order. The primed summary is shortened from "A slow hero clip from a stored picture." to "A slow clip from a stored picture." because clips are no longer only heroes.

**UATs**
- `tests/test_UAT_FC_REQ-470_video_sequences_and_hover.test.ts` (jsdom): `loopSrc` allowlist / clip-extension / asset reference; `loopSrc` needs `once`; `hover` accepted, unknown trigger rejected, hover refuses `loopSrc`/`replay`; renderer markup for both; intro `ended` → loop which loops; the loop part rests; once-per-session repeat view goes straight into the loop; reduced motion fetches neither clip; hover plays on pointerenter and returns to the poster on leave, nothing requested before; hover `once` rests on its last frame; a focusable ancestor's pointer and keyboard focus count as hover; under `(hover: none)` it plays once in view and doesn't replay; reduced motion keeps a hover clip a poster.
- `tests/test_UAT_FC_REQ-470_video_roundtrip.test.ts` (Chromium): render → capture → fold reproduces `loopSrc` (with and without `restMs`/`replay`) and `trigger: 'hover'` (loop and once).
- `tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts`: the op guidance offers intro-then-loop alongside either/or and names hover for illustrations; the primed summary stays one short line.
- `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts`: provocations added for `loopSrcNeedsOnce` and `hoverPlaysAlone`. (This suite already fails on clean xgd-working because `ascendingAnimateStops` and one other rule from 5ea0b90de5 have no provocation. That is not part of this ticket.)

**Not done here (operator):** the Dina's Diner and Lagrange Foundry pilots need clips generated and placed on dev, plus `bin/deploy --env dev`.