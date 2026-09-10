---
uid: comment-d7e6b937
id: COMMENT-2616
type: comment
title: Comment on request REQ-218
created_by: xgd
created_at: '2026-09-10T22:08:15.654310+00:00'
updated_at: '2026-09-10T22:14:09.673895+00:00'
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

<!-- xgd-chat-end -->