---
uid: bug-83a90ebd
id: BUG-206
type: bug
title: 'Publish: a full-size camera photo makes the site unpublishable (IMAGES_TRANSFORM_ERROR
  9529)'
created_by: EPIC-16
created_at: '2026-10-10T18:19:23.451391+00:00'
updated_at: '2026-10-12T11:25:56.826200+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  severity: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-eaa38ee5
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