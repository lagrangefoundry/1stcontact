---
uid: request-82f960f5
id: REQ-461
type: request
title: 'Hero motion: video node, AI clip tool wiring and pilot'
created_by: EPIC-26
created_at: '2026-10-25T21:02:35.507971+00:00'
updated_at: '2026-10-25T21:02:35.507971+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  parent_uid: epic-2a432012
  auto_merge_back: true
  needs_review: false
---

## Status

Draft. Child of EPIC-26. **Blocked on lagrange-framework REQ-220** (`ai_videogen` component: the image-to-video tool, including pingpong reversal and size-budget processing). Part 2 (the L1 video node) does not depend on it and can start first.

## What changes for the user

The builder can turn a site's still photo into a short, silent hero clip and place it on the page as a typed video element. Visitors see the still first, then the motion. Visitors who turn off motion see only the still.

### 1. Tool wiring (control app)
- `apps/control-app/src/videogen.ts` mirrors `imagegen.ts`.
  - New deploy secret `FAL_KEY` (`bin/deploy.d/secrets/`). When it is missing, the tool is omitted and the deploy still proceeds.
  - Results are a `material` ticket with `kind: 'video'` (`origin: 'generated'`); the bytes are an attachment. The returned last frame is stored as an image material for the poster.
  - Published to `/assets/*.mp4`.
- `slow-tools.json` entry (about 2–4 min). The REQ-205 progress heartbeat runs while the provider is polled.
- **Spend:** video is charged per second, not per token. Add a non-token cost path into `turn_spend`/`request_spend` so clip cost shows in REQ-292 reports. Add a per-site generation cap.
- **Disclosure:** the client is told before the first generation that their photo is sent to an AI provider (Architecture Policy 26).

### 2. L1 `video` node (`packages/site-schema/src/l1`, `packages/framework/src/l1`)
A sibling of `l1ImageSchema`, `.strict()`:
- `src`: `.mp4`/`.webm`, passes `isSafeUrl`.
- `poster`: an image src, **required**.
- `alt`.
- The same fit/zoom axes as image.
- `playback: once | loop`.
  - `once` plays and then holds the last frame.
  - `loop` repeats.
  - Pingpong clips need no value of their own: the file is already a palindrome and plays with `loop`.
- `restMs` (loop only, default 0): after each play, rest on the final frame for this long, then play again. Example: robot hands move a little, stop, wait 10 s, move again. Bounded, e.g. 0–60000.
- `replay: every_visit | once_per_session` (once only), chosen per video. Under `once_per_session`, a repeat view in the same browsing session shows the final frame (the poster) without playing. The key is per clip `src` in sessionStorage.
- `trigger: load | in-view`.
- Always muted and `playsinline`; never `controls`; no audio. None of these can be configured.

Renderer:
- emits `<video muted playsinline autoplay [loop] preload poster>`
- under `prefers-reduced-motion`, renders the poster only
- `restMs` and `once_per_session` need a small framework-owned runtime script (on `ended`, wait and then `play()`; the sessionStorage check). It is part of the fixed framework, never instance code (Security Policy §3).

Capture must round-trip the node (`capture(render(L1)) ≈ L1`, REQ-82).

### 3. Consultant / builder guidance
- When to offer motion: at most one hero clip per page; subtle movement.
- How to pick a mode: `reveal` for "ends on the real photo", `loop` for fire, steam or water, `pingpong` for camera drift or gentle motion, `restMs` for occasional movement.
- Show the estimated cost before generating.
- Keep it to op summaries, because the priming budget is near full (BUG-129).

### 4. Pilot (acceptance)
On dev:
- **Dina's Diner:** steak-and-eggs pepper reveal, `once`.
- **Ariel's Arc Welding:** Old Scratch fire/smoke `loop`, compared against the `scratch-flicker-2.svg` overlay from BUG-259.

Candidate for a later trial: the Lagrange Foundry robot hands, using `loop` with `restMs` of about 10000.

## Test plan
UATs `test_UAT_FC_<ID>_*`:
- **Security (REQ-82 envelope):**
  - an unsafe src or poster is rejected
  - unknown keys are rejected
  - a missing poster is rejected
  - out-of-range `restMs` is rejected
- **Renderer output:**
  - the tag carries muted/playsinline/loop/poster as specified
  - `controls` is never emitted
  - reduced motion renders the poster only
- **Runtime script:**
  - with `restMs`, the clip plays again after the rest
  - with `once_per_session`, it does not replay within the session
- capture round-trip
- the tool is omitted without `FAL_KEY`
- a generated clip is stored as a `video` material with a poster material
- clip cost appears in the spend report
