---
uid: request-82f960f5
id: REQ-461
type: request
title: 'Hero motion: video node, AI clip tool wiring and pilot'
created_by: EPIC-26
created_at: '2026-10-25T21:02:35.507971+00:00'
updated_at: '2026-10-28T03:54:07.763322+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-2a432012
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b2fc67f8
  commits:
  - working_sha: 0fe94f2962b8bb176feb069baa8404156f5d1a1e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b419f3f9a5fac18ee648ca65efc5a7000fd8e331
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: f7aa91d6c75a551662a23bb99ffb6b87c01dbd20
    reconcile_sha: null
    main_sha: null
  version: 0.2.659
  story_points: 13
---

## Status

Free-coded (2026-10-25). Child of EPIC-26. lagrange-framework REQ-220 (the `ai_videogen` / `videogen` components) has landed and is installed in the shared store, so parts 1–3 are built here; part 4 (the pilot) needs a live `FAL_KEY` on dev and is the operator's — see *Not done here* below.

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
- **No prices to the client (operator, 2026-10-25):** the client pays the operator, and the operator pays for the services they use. The consultant never tells the client what a clip costs: neither the disclosure nor the guidance carries a price, both say not to mention one, and the tool result the model sees carries no cost. The cost is metered for the operator only.
- **Limits (operator, 2026-10-25):** at most 10 clips per session and 50 per client business.

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
- Get a yes before generating, without mentioning a price or cost.
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

## As built (free-coded, 2026-10-25)

### 1. Tool wiring (control app)
- `apps/control-app/src/videogen.ts` mirrors `imagegen.ts`: `videoSurface(env, tickets, index, opts)` returns `{surface, granted}` or `null`. It installs upstream's `animate_image` plugin (surface `videogen`, tool `AnimateImage`), provider `fal`, credential name `FAL_KEY` read from the plugin's own table. Composed in `router.ts` beside the image surface and passed to `workerHost` (new trailing parameter); granted to the **consultant only**. `FAL_KEY` is on the router's redaction list.
- **No key, no tool.** Without `FAL_KEY` the surface is `null`, the grant narrows away, and nothing else changes. `bin/deploy.d/secrets/50-fal-key` follows the OpenAI hook's table: absent → deploy anyway and say so; a key fal refuses (401/403 on a queue status read, `probe.mjs` `FAL_KEY` entry) → fail the deploy.
- **A clip is a `video` material; its last frame is an `image` material of its own.** The scoped store (`videoMaterialStore`) writes the clip as `material` with `kind: 'video'`, `origin: 'generated'`, owned and republishable, labelled `VIDEO-n`. The plugin attaches the poster to the clip's ticket; this store files it instead as a separate `image` material (`IMAGE-n`, titled "… — last frame"), records it on the clip as the new material field `poster`, and the result the model gets has `poster` = that material's id. So the clip's own material holds one file (the mp4), and each is placed on a site with the Library's existing `place`, which publishes to `/assets/*.mp4` and `/assets/*.png`. The material `kind` enum and `kindOf` gain `video` (an uploaded `video/*` file is a `video` too, described as `unsupported` rather than read as a document).
- **Disclosure (Architecture Policy 26).** The first `AnimateImage` call for a business is refused (`invalid_request`) before anything is sent, with the sentence to say: the photo goes to an outside AI video service — and not to mention any price or cost. The next call goes ahead. Remembered per business with the tenant's atomic `nextCounter` (`videogen:disclosed`); no schema change.
- **Per-site cap and session budget.** `VIDEO_SITE_CAP = 50` clips per client business, lifetime, counted with `nextCounter('videogen:clips')` in front of the provider call (after upstream's validation and the per-session budget), so a malformed request costs nothing against it. `VIDEO_SESSION_BUDGET = 10` clips per session, passed to upstream's toolbox in place of its default of 5. Over the cap → `budget_exhausted` naming the client cap; nothing is sent.
- **Spend.** Each clip writes its own `turn_spend` row (`recordMediaSpend` in `spend.ts`): role `media`, outcome `media`, backend `fal`, the model id, zero tokens, `cost_micros` from upstream's estimate (per-second price × generated seconds; USD only, otherwise unpriced). The tool result returned to the model has upstream's `estimated_cost` removed, so the model is never handed a price. Its session is its own and it starts and ends at one instant, so the REQ-293 report's engaged-time clock is unchanged while the cost appears in the total, under `byRole.media` and under the model. Recorded after a successful generation; a meter failure never fails the clip.
- **Heartbeat.** `slow-tools.json` gets `AnimateImage` → "Making a video clip", 5 minutes (the file allows only 1/5/30). The plugin's per-poll `onProgress` drives a new host-core seam, `slowToolHeartbeat(deps)`, throttled to once per 30 s: it re-posts the live consultant turn's own working status as model progress, so the BUG-249 stall watch does not abandon a round parked in a long fal poll. Bound in `router.ts` once the host exists.
- `AnimateImage` is in the talker's `withhold` list. `1c assets` writes two new shims, `generated/ai-videogen.js` and `generated/videogen.js` (the latter only for the pinned price table).
- **Range requests.** The public site now answers `Range` on any non-HTML asset with `206 Partial Content` (`accept-ranges`, `content-range`, 416 for an unsatisfiable range), using R2's native `range`. Without it Safari will not play an mp4 inline. Pages are never ranged.

### 2. L1 `video` node
- `l1VideoSchema` (`.strict()`): `kind: 'video'`, `id?`, `src`, `poster` (required), `alt`, `playback: once | loop`, `restMs?`, `replay?: every_visit | once_per_session`, `trigger?: load | in-view`, `aspect?` (the design's named aspects, as for a picture), `axes?` (`l1ImageAxesSchema`: `objectFit`, `objectPosition`, surface), plus the shared node axis groups. No `link`/`zoom`. Muted / playsinline / no controls / no audio are not fields.
- Validator: `src` and `poster` pass `isSafeUrl`; `src` must end `.mp4`/`.webm` (query and fragment ignored; `isVideoSrc`); `restMs` in `L1_ENVELOPE.videoRestMs` = 0–60000 and only with `loop`; `replay` only with `once`. Three new structural rules: `videoSrcIsAClip`, `restNeedsLoop`, `replayNeedsOnce`. A clip's `src` and `poster` are asset references (held-asset check, digest) and are localised by the capture's asset step.
- Renderer: `<video muted playsinline [autoplay] [loop] preload poster aria-label|aria-hidden>` with the clip as `<source … media="(prefers-reduced-motion: no-preference)">`. **Design decision:** reduced motion is handled by the source's media gate rather than by script — a still visitor's browser matches no source, fetches nothing and shows the poster, with no flash of motion. `autoplay` and `loop` are emitted only where the element can honour the node alone; a clip with `restMs > 0`, `once_per_session` or `in-view` is driven by `L1_VIDEO_SCRIPT` from `data-l1-video-*` attributes (no `autoplay`), so with no script it shows its poster. `controls` is never emitted. Unsafe values are dropped at emit time. The edit render emits no source, no autoplay and no script (poster only).
- `L1_VIDEO_SCRIPT` (framework-owned, shipped only on a page that needs it, exported for CSP hashing): returns at once under reduced motion; on `ended` waits `restMs` then replays; for `once_per_session` keys sessionStorage on `l1-video:<resolved src>` and plays only on the first view of the session; for `in-view` plays on first intersection.
- Capture round-trip: the capture records `<video>` (source read as an attribute, since a reduced-motion capture never loads it), its poster and the `data-l1-video-*` behaviours as a carried `video` axis; the fold emits a `video` leaf.

### 3. Consultant guidance
- Not in `priming.json`. The guidance ("at most one on a page, subtle; get a yes, and never mention a price or cost to the client — clips are part of their service; place the clip and its last frame and use them as a `video` element's `src`/`poster`; reveal plays `once`, loop/pingpong play `loop`, `restMs` for movement that comes and goes") is appended to the `animate_image` operation description through upstream's `declaration` seam, which the priming budget does not count.
- **Budget (BUG-129):** with `FAL_KEY` granted the summary manual gains the surface's block, so the host declaration also shortens the summary-level text — title and group title "Clips", no overview or group description (upstream's overview paragraph and summary move, whole, into the op description), one-line summary "A slow hero clip from a stored picture." — and one product-system priming sentence (the IMAGE-5 catalogue-number paragraph) is tightened without changing its meaning. The BUG-129 deployment now includes `FAL_KEY`: 99,986 of 100,000 chars (was 99,961 without the clip tool).
- The plan-panel priming's "the top banner stays still, nothing slides or spins" is removed (operator, 2026-10-25): it contradicted a hero clip. The Finishing-touches line now reads "…a slight lift on buttons), then…".

### Not done here
- **Pilot (part 4).** Needs a real `FAL_KEY` in the dev secrets and a deploy (`bin/deploy --env dev` also runs `1c assets`, which writes the two new shims). Then: Dina's steak-and-eggs pepper `reveal` (start frame from `EditImage`, `playback: once`), Ariel's Old Scratch fire `loop` compared against BUG-259's `scratch-flicker-2.svg`.
- fal's queue-status behaviour for an unknown request (the deploy probe's assumption) is not verified live.

## Test plan (as built)
UATs, all `test_UAT_FC_REQ-461_*`:
- `tests/test_UAT_FC_REQ-461_video_node.test.ts` (node + jsdom): envelope security — unsafe src/poster (javascript:/data:/file:/attribute break-out) rejected, non-clip src rejected, unknown keys (`controls`, `muted`, `autoplay`, `audio`, `style`, `html`) rejected, missing poster rejected; robustness — `restMs` out of range or on `once`, `replay` on `loop` rejected; renderer — muted/playsinline/autoplay/loop/poster as specified, a resting loop driven by the runtime, `controls` never emitted, reduced motion = media-gated source (poster only), a value that bypassed the validator neutralised, runtime shipped only when needed and never in the edit render; runtime — with `restMs` the clip plays again after the rest, `once_per_session` does not replay within the session (and does in a new one), nothing plays under reduced motion.
- `tests/test_UAT_FC_REQ-461_video_roundtrip.test.ts` (real Chromium): `capture(render(L1))` folds back to the same clips — files, alt, `playback`, `restMs`, `replay`, `trigger`, `objectFit`.
- `tests/test_UAT_FC_REQ-461_hero_clip_tool.workers.test.ts` (real plugin, D1 store and meter; fal faked at HTTP): tool omitted without `FAL_KEY`; first call refused with the disclosure and nothing sent; the client is never told a price (no price in the disclosure, the guidance, the op description or the tool result; no "paid" in the summary); a session makes up to 10 clips and the 11th is refused with nothing sent; a clip is a `video` material with one mp4 file and a separate poster `image` material named in the result, vendor never shown; clip cost in the spend report (total, `media` role, model; engaged time 0); site cap (50) refuses with nothing sent; heartbeat fires while fal is polled; the manual carries the hero guidance.
- `tests/test_UAT_FC_REQ-461_published_clip_plays.test.ts`: a published mp4 is served whole with `accept-ranges`, in parts with `206` + `content-range` (explicit, open-ended and suffix ranges), `416` beyond the end; a page is never ranged.
- Adjusted: REQ-386's slow-tool list includes `AnimateImage`; BUG-129's deployment includes `FAL_KEY`; BUG-48 provocations for the three new rules.