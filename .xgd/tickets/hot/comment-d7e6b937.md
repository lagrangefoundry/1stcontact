---
uid: comment-d7e6b937
id: COMMENT-2616
type: comment
title: Comment on request REQ-218
created_by: xgd
created_at: '2026-09-10T22:08:15.654310+00:00'
updated_at: '2026-09-11T02:06:07.199646+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-1f64eecf
  kind: chat_transcript
---

<!-- xgd-turn id="38d3bfd3-8bd8-43be-b406-b39b98a95c0a-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:07:37.542533+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="38d3bfd3-8bd8-43be-b406-b39b98a95c0a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:14:08.950527+00:00" -->
#### Claude
I've traced the whole path. Findings below — no code changed.

## The seam is exactly where the ticket says it is

`tools/generate/src/cli/picture.ts` — `resolvePicture` — is the single resolver, and its own header states the property this ticket relies on: *"a sixth kind of picture is added here and every verb gets it."* That much is true. The mechanical work is small: the `PictureKind` union, fields on `PictureSource`, a `case` in the switch, a refusal reason in `drivableSteps`, `null` from `pictureUrl`, and the enum + prose in `fidelity-surface.json` (`surface_version` 3 → 4; the overview and `screenshot`'s summary both say "one of five things" in words).

Everything below is what sits *behind* that seam and does not work yet.

## The blocker: `ResolvedPicture.bytes` is an unstated PNG contract

Both consumers decode before they do anything:

- `fidelity-core.ts:207` — `decodePng(picture.bytes, …)` before every downscale and every returned block.
- `fidelity-core.ts:338-339` — `decodePng` on **both** sides of `compare`.

And `png.ts` is PNG-only *deliberately* — REQ-156 replaced the native codec, and `refuseNonPng` throws by name on JPEG/WebP/GIF/HEIC/SVG. The assumption has never been tested because all five existing kinds get their bytes from `driver.screenshot()`, which is always PNG.

So two claims in the ticket body don't hold as written:

- **"It is downscaled on the way in… the machinery and the argument are already in `fidelity-core.ts`."** The machinery is there and is PNG-only.
- **"`compare` gains it for free."** Free for a stored PNG. For anything else `compare` needs a raster and nothing in the repo can produce one.

## There is a cheap path for `screenshot`, and none for `compare`

`describe.ts` already puts arbitrary stored image bytes in front of a vision model with no codec at all: `VISION_MEDIA_TYPES = {jpeg, png, gif, webp}`, `VISION_MAX_BYTES = 5MB`, and `ai.ts` sends `imageBlock({ mediaType: contentType, data: base64 })` — bytes as stored, no decode, no downscale.

That precedent would make `screenshot` of a stored JPEG work today. What it gives up is the downscale — whose *reason* is the strongest argument in the epic (the image stays in every subsequent turn, not just this one) — and the `size` field of the `picture` shape, which is documented as "after any reduction" and comes from the raster. And it does nothing whatever for `compare`.

## SVG is the epic's own motivating case and the hardest one

`write_image` writes SVG, and `editAssetWrite` puts it in the **site asset** store only — a drawing is never a material. SVG is in neither `VISION_MEDIA_TYPES` nor anything the provider accepts, and `decodePng` cannot read it. Looking at a drawn wordmark therefore requires rasterisation, and the only rasteriser in the repo is the browser.

`measure-core.ts` is the precedent worth copying: it navigates the site's own draft preview and evaluates there, *because the page is the font context* — which is precisely what a wordmark needs. But `BrowserDriver.screenshot(viewport)` is full-page-at-a-viewport with no element clip, so an image-shaped picture means reading `naturalWidth/Height` via `evaluate` and shooting at that viewport.

Worth noting: site assets are already served in-process at `/preview/<slug>/<channel>/assets/<name>` (`preview.ts`), so the browser can reach them without any new plumbing.

## Two namespaces — the ticket names one, the gap spans both

| | Library / material | Site assets |
|---|---|---|
| holds | generated images, client uploads | `write_image` drawings, promoted uploads |
| named by | ticket title (REQ-220 makes it editable) | filename under `assets/` |
| bytes in | `BLOBS` — private | `SITES` — public |
| read via | `materialFile(tickets, uid, member)` | `store.asset(slug, name)` |
| assistant can enumerate it? | **no** | yes, `list_assets` |

`promoteToSiteAsset` is a deliberate **byte copy across the bucket boundary** — `SITES` serves the public internet and `BLOBS` holds confidential client material, so one photograph exists twice under two names, and `freeAssetName` can rename it on the way. They can diverge.

"Named the way the Library names it" points at materials. But the assistant has no operation that lists material — `instances.json` grants it `l1` and `fidelity` only — so it could only name an image it had just been told about, and its own drawings would still be invisible. Naming site assets instead covers drawings and everything it can already discover, needs no ticket store (so it works on the CLI host too), and excludes reference-role uploads and anything not yet placed.

**This is the decision I'd most like to settle before anything is written.**

## The dependency runs the other way round from how it's stated

The body says it "is not blocked on the editor" because against an unedited image it works on the bytes as stored. That holds for a stored PNG and nothing else. For every other format the missing thing isn't the recipe — it's a **decoder**, and REQ-219's Cloudflare Images binding is the only thing in the epic that supplies one. It is also the only thing that makes `compare` work at all.

There is no `[images]` binding in `wrangler.toml` today. And if REQ-218 is built on it, the CLI host has none — it would need the browser fallback, or to omit the kind. There's a clean precedent for omitting: `adoptCapture` is optional-because-Worker-only, and the whole fidelity surface is `null` when the CLI has no origin.

## Smaller mechanical notes

- `drivableSteps` needs its own refusal sentence for the new kind — a stored image is not a page, so `after` is meaningless against it — and `pictureUrl` must return `null`, since it's the "has a live page" predicate the value gates read.
- The "original vs current" ask is a field on `PictureSource` and is only meaningful once recipes exist; against an unedited image the two are the same bytes, as the ticket says.

## What I'd want agreed before coding

1. **Which namespace** the sixth kind addresses — materials, site assets, or both.
2. **Whether it lands after REQ-219's renderer** (my read: for `compare` it has to), or whether v1 is deliberately PNG-and-SVG-only on the browser path with a named refusal for other formats.
3. **Whether the CLI host gets this kind at all**, or omits it the way it omits `adoptCapture`.

<!-- xgd-turn id="ca481a6d-fd9f-4410-869c-0010de98c433-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T01:35:12.640872+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0e8aaed7-846f-472a-b2fe-d7567992aec8-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T01:36:41.094040+00:00" -->
#### You
This should understand both namespaces - the AI should have access to all the images in the store, however they are referenced

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above): Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance. Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0e8aaed7-846f-472a-b2fe-d7567992aec8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T02:06:07.148291+00:00" -->
#### Claude
Design settled. Let me scope the ticket first.

Now implementing. Starting with the naming vocabulary, which is the piece both namespaces share.

Now the rasteriser — the piece that makes `compare` work for free.

Now the resolver case itself.

Now the surface declaration — the part the model actually reads.

Now wiring the operation into `fidelity-core.ts` and the two hosts.

Now the UAT suite.

All green — the one extra failure is a parallel-load flake that passes in isolation, and every other failure is on the baseline too. Now closing the trace from UATs back to ticket language.

The ticket picked up an epic-level answer from another agent after my investigation. Reconciling with it — one of its decisions changes what I built.

Now the UATs that asserted `list_images`.

No new failures against baseline. Committing.

Done. REQ-218 is `free_coded` at version 0.2.159, merged into `xgd-working`.

## What landed

**The sixth kind costs one enum entry and two fields.** `resolvePicture` in `picture.ts` was already the single resolver, and its own header promised that "a sixth kind of picture is added here and every verb gets it." That promise held — `screenshot`, `compare` and `check_fidelity` gained the kind without being touched.

**Both namespaces, one name** (`tools/generate/src/cli/image-library.ts`, new). Site assets and Library items stay in their separate buckets — one serves the public internet, one holds confidential client material — but the *name* is unified. A picture answers to its site filename, the `/assets/…` handle a page carries, the bare stem a drawing was written under, its Library record, or its Library title. Each namespace declares its own spellings, so the matcher is one comparison over a flat set. Ambiguity is refused with the candidates named rather than guessed at.

**The PNG contract, found and honoured.** `ResolvedPicture.bytes` carried an unstated PNG assumption — `decodePng` runs on every returned picture and on both sides of `compare` — which held only because all five existing kinds get their bytes from `driver.screenshot()`. Rather than break it, `rasterizeImage` puts any non-PNG in front of the browser this surface already leases, so resolution still hands back PNG. A stored PNG passes through untouched. The existing reduction cap and diff work unchanged.

Also: `.gif` and `.avif` gained entries in the shared MIME table — they've counted as images in the asset listing since REQ-118 while that table had no entry for either.

**9 UATs**, all passing; full suite shows zero new failures against baseline (16 vs 27 pre-existing).

## Two places I departed from the epic's answers — please review these

Another agent answered my investigation questions on the ticket while I was building. I complied with one and departed from two, recorded in the ticket body:

1. **Complied — no `list_images`.** I'd built a listing operation; the epic scoped it out on the grounds that a picture's handle arrives in the result of whatever made it. I removed it.

2. **Departed — raster works now, not after REQ-219.** The epic deferred raster to the Images binding because a Library blob has no URL an unauthenticated browser may fetch. It doesn't need one: the picture travels inline in the document it's photographed in. So the downscale, the reported size and `compare` all work today for a photograph. When the renderer lands it replaces this at one seam.

3. **Departed — the CLI keeps the kind.** The epic said a local `1c` session "simply has five kinds." But the local builder has a site store, so a drawing it just wrote is on its own disk — that's the `measure_drawing` loop. It answers for site assets and says it holds no Library.

**The cost of (3), stated plainly:** a drawing is photographed in a bare document, not inside the site's page, so its text renders in the browser's default face rather than the site's. The epic is right that the site's own page is the better font context. The picture carries a caption saying so and points at `measure_drawing`. Moving the drawn path onto the draft preview is a refinement left open at the same seam — worth doing if wordmark fidelity matters more than I've judged.

<!-- xgd-chat-end -->