---
uid: bug-83a90ebd
id: BUG-206
type: bug
title: 'Publish: a full-size camera photo makes the site unpublishable (IMAGES_TRANSFORM_ERROR
  9529)'
created_by: EPIC-16
created_at: '2026-10-10T18:19:23.451391+00:00'
updated_at: '2026-10-12T11:49:28.630028+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  severity: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-eaa38ee5
  commits:
  - working_sha: 7584ed475d1069848af6c816e716f94ac71ef8be
    reconcile_sha: null
    main_sha: null
  - working_sha: 6d19224bb5d3b5b279d33ff4eeb0157001eb45d4
    reconcile_sha: null
    main_sha: null
  version: 0.2.503
  story_points: 5
---

## Symptom (2026-10-10, production)

Publishing `faelan.com` failed with:

> This site was not published. IMAGES_TRANSFORM_ERROR 9529: The image is too large to process or the service is too busy

The site's images: `scorched-earth.jpeg` is **5712 × 4284 (24.5 MP, 7.8 MB)**; the next largest is 2693 × 2149 (5.8 MP); the rest are under 0.5 MP. Nothing else about the site is unusual. 24.5 MP is an ordinary camera photo — phones ship 12–48 MP and 200 MP sensors exist — so **any customer who uploads a photo straight off their camera can be unable to publish**, and nothing tells them which picture or what to do.

## Root cause

The publish-time image ladder (`tools/generate/src/publish/ladder.ts`, driven from `apps/control-app/src/image-ladder.ts` through `env.IMAGES`) resizes every source picture into each delivery width straight from the original bytes. Its only source-size guard is `LADDER_MAX_SOURCE_BYTES` (32 MB) on **bytes**. Nothing considers **pixel dimensions**, which is what the Images transform refuses on — a 7.8 MB JPEG passes every check this code has and is still refused by the service. The service's error is passed through raw, naming a Cloudflare code instead of the picture.

(Confirm in the implementing session which transform actually failed and the service's real input limit for the Images binding — measure it, do not assume a documented number applies to the binding.)

## Fix — make a large photo work, not merely refuse it legibly

1. **Normalise at the door.** When a picture enters a site (upload, `/api/import`, AI image placement — every path that writes a site asset), a source whose long edge exceeds a platform maximum (a named constant, chosen from the measured service limit with headroom and well above the largest delivery width, 1920) is downscaled once, preserving aspect, orientation and format, and THAT is what the site stores. The customer's experience is that their photo simply works. Whether the untouched original is kept beside it (for a later, larger delivery width) is the implementing session's call — record it.
2. **The ladder never hands the service something it will refuse.** Before transforming, the ladder reads the source's dimensions (headers only — no decode into the Worker's memory, per REQ-305/I26) and, if a picture still exceeds the maximum (existing assets, anything that bypassed the door), first produces one capped intermediate and derives every rung from that.
3. **Transient refusals are retried.** 9529 also means "too busy"; a bounded retry with backoff on that code before failing.
4. **A failure that remains names the picture.** If publish still cannot process an image it refuses with the asset's name and dimensions and what to do ("`scorched-earth.jpeg` is 5712 × 4284; …"), never a raw service code — the same principle `LadderTooLargeError` / `LadderTooHeavyError` already follow.
5. **Existing oversized assets.** A one-shot sweep (or lazy normalise-on-publish) brings already-stored oversized pictures under the cap, so sites copied or uploaded before this fix publish too. Faelan's `scorched-earth.jpeg` is the first instance.

## Boundaries

- Peak memory stays O(largest single asset) (REQ-304/305). Reading dimensions must not decode the image in the Worker.
- Delivery widths and formats are unchanged; this only changes what the ladder starts from.
- HEIC conversion (`heic.ts`) already transforms at the door — reuse that seam rather than adding a second one.

## Test plan

UATs (`test_UAT_FC_<id>_*`): a 24 MP photo uploaded/imported is stored at ≤ the maximum long edge with aspect preserved; a site holding a pre-existing oversized asset publishes, and every rung derives from a capped source; a picture at or under the maximum is stored byte-identical (no needless re-encode); a transient 9529 is retried and the publish succeeds; a persistent failure's message names the asset and its dimensions and contains no raw service code; reading dimensions does not load the image body into memory beyond its header.


## Implementation design (BUG-206 session, 2026-10-12)

- **One cap, one implementation.** `MAX_SOURCE_EDGE` (4096 px on the long edge) and `capSource()` live in `tools/generate/src/publish/ladder.ts`. Both the door and the ladder call `capSource()` over the same `ImageSizer` port, so there is one definition of "too big" and one way of shrinking.
- **Why 4096.** The limit could not be measured from this session: the sandbox cannot reach the deployed Worker, and the local workerd `IMAGES` emulation is not the service. The production evidence brackets it instead: a 5.8 MP picture (2693 × 2149) laddered fine, including a WebP encode at its full width, and a 24.5 MP picture (5712 × 4284) was refused. The likely failing transform is the WebP rung at the source's own width, which is 24.5 MP of output. 4096 on the long edge is 12.6 MP at 4:3, roughly the geometric middle of the known-good and known-bad sizes, and more than twice the widest delivery width (1920). **Open item:** measure the binding's real limit on a deployed environment and adjust the constant if needed.
- **The door is a site-store write decorator (`cappedSiteStore`, control-app).** The router wraps every site store it opens. Every Worker path that writes picture bytes onto a site goes through `SiteStore.write({ assets })`: Library promotion and AI placement through `editAssetAdd`/`editAssetReplace`, `/api/import`, and the AI's own asset tools. A laddered picture (`isLadderedAsset`) whose long edge is over the cap is replaced with the capped copy before it lands. Its format is kept (the render has no `type`). The capping transform scales down to fit, so aspect is preserved and the Images service's EXIF handling decides orientation. A picture at or under the cap, a non-picture, or a picture the renderer cannot read is stored **byte-identical** (no re-encode). The door uses the same renderer and binding composition as HEIC and editing (`imageRendererFor` → the ladder's sizer adapter); no second binding path is added. If capping fails at the door (the service is busy or refuses), the original is stored and the ladder retries at publish. An upload or import never fails because of this.
- **Untouched originals.** The site stores only the capped copy. The original stays where it already lives: the Library material for uploads and AI-placed pictures, or the operator's disk for `/api/import`. No new storage.
- **The ladder caps before it transforms.** For a source over the cap, the ladder plans from one capped intermediate (`capSource`, re-measured through `info`) and derives every rung, `held` checks included, from it. The manifest still names the stored original as the top source-format rung with its real dimensions, so delivery widths and formats are unchanged. Dimensions come from the binding's `info()` (headers only, nothing decoded in the Worker), and only pictures over the cap pay for an intermediate. Through the cached renderer, the intermediate is a cache hit after the first publish.
- **Existing oversized assets are handled lazily at publish, with no sweep.** `scorched-earth.jpeg` publishes through the ladder's intermediate without rewriting the stored asset. A one-shot sweep would need production access and a write to every affected draft. The lazy path covers the same sites with no migration.
- **Transient refusals are retried in the renderer** (`imagesRenderer`, so editing benefits too): an error carrying `9529` gets up to two retries with backoff (200 ms, 800 ms), and every attempt rebuilds the input stream.
- **A remaining failure names the picture.** Any service error from measuring or sizing one picture during publish becomes `LadderPictureError`. It names the asset, gives its pixel dimensions when known, says to publish again later or replace it with a copy no larger than the cap, and contains no raw service code. Unreadable pictures still drop out quietly (unchanged).

## Test plan (as implemented)

`tests/test_UAT_FC_BUG-206_camera_photo_publishes.workers.test.ts`, driven through `route()` with a fake Images binding at the external boundary. The fake refuses any transform whose output is over 16 MP with the real 9529 message:
- a 24 MP photo imported through `/api/import` is stored with its long edge at or under `MAX_SOURCE_EDGE`, aspect preserved, same format;
- a picture at or under the cap is stored byte-identical, and no transform is requested for it;
- a site holding a pre-existing oversized asset (written past the door) publishes, and every rung is derived from the capped intermediate (no transform is ever handed the full-size source);
- a transient 9529 is retried and the publish succeeds;
- a persistent 9529 fails the publish with a message naming the asset and its dimensions and containing no `9529`/`IMAGES_TRANSFORM_ERROR`;
- reading dimensions goes through `info()` only: measuring an at-cap picture issues no `input()` transform.