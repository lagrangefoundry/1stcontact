---
uid: request-6dd070ae
id: REQ-652
type: request
title: 'Image viewer: a ~3,000 px zoom rendition for images that carry zoom'
created_by: REQ-650
created_at: '2026-11-05T00:46:58.721889+00:00'
updated_at: '2026-11-05T15:33:36.039206+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-36eaca27
  commits:
  - working_sha: 2e406bd2d606e13d154a7729dea81196b8cc51bc
    reconcile_sha: null
    main_sha: null
  - working_sha: 486f16f7ae91a271a929e779cd7a30dcbcf9464a
    reconcile_sha: null
    main_sha: null
  version: 0.2.777
  story_points: 5
---

## Why

Split from REQ-650 (operator decision Q2, 2026-11-05: split if REQ-650 would exceed 20 points). REQ-650's viewer zooms the largest ladder rendition (1,920 px, `DELIVERY_WIDTHS`), which goes soft at 2–3× on desktop. REQ-327 originally showed the original upload for readable fine detail; REQ-650 stopped that (originals can be tens of MB and not web-safe).

## What to build

- A **~3,000 px wide** rendition, built by publish (`tools/generate/src/publish/ladder.ts`) **only for images that carry `zoom`** (authored L1 and the catalog product-page template's bound photos), never upscaled (strictly below the source width).
- The viewer requests it **only when the visitor zooms in** (the full-width/zoom view). Opening the viewer and the whole-photo view keep using the 1,920 px rendition.
- Never the original upload.

## What changed (as built)

- **Width:** `DELIVERY_ZOOM_WIDTH = 3000` (`packages/framework/src/l1/delivery.ts`). A zoomed picture gets it only when its (capped) source is **wider than 3,000 px**. A narrower picture gets no zoom rendition, and the viewer keeps zooming its largest ladder rendition. It is in the source's own format (no WebP copy), in the same content-addressed `assets/d/<sha>-3000<ext>` space, and counts against the ladder's existing rendition ceiling. Like every rung, it is recorded only if it landed.
- **Manifest:** `ImageDelivery.zoom` is a new optional field, kept outside `renditions` and `sources`, so no `srcset` offers it and no placed picture can choose it.
- **Which pictures carry zoom:** `zoomedAssetNames(definition)` walks the whole site definition and returns every `kind: 'image'` node with a `zoom` object, wherever it is nested: pages, chrome, module slot fragments. It takes `zoom.src`, else the image's own `src`, as a site asset name. `publishSite` passes that set to the ladder (`LadderSource.zoom`). Pictures not in it get no zoom rendition.
- **Catalog product-page photos:** every catalog photo gets the zoom rendition when it is prepared (`apps/control-app/src/catalog-photos.ts`), stored beside its ladder under `assets/s/`. The product page binds each photo into the viewer (`zoom.group`, REQ-650), and catalog photos are prepared apart from any one page. An index entry prepared before this change (a ladder but no `zoom: true` marker, on a photo wider than 3,000 px) is prepared **once** more to add the rendition. After that it is left alone.
- **Page:** the viewer's large `<img>` carries `data-l1-zoom-hi="<zoom rendition>"`, but only when the manifest has one, so draft and preview renders have none. It sits beside REQ-650's `data-l1-zoom-src` (the 1,920 px rendition). The no-script link still points at the 1,920 px rendition.
- **Viewer script:** the first time the photo is enlarged past the whole-photo view (click to full width, wheel, pinch, double tap or +), the script sets the image's `src` to the zoom rendition. It keeps that file from then on, so zooming out and in again requests nothing more.

## Design decisions

- **A catalog photo always gets the rendition** rather than only when the site's product page actually zooms it. Catalog photos are prepared before the publish loads the definition and are shared across the site's pages. A site whose authored product page drops `zoom` therefore pays for one unused rendition per photo, but no page ever asks for a file that wasn't built.
- **The zoom file is swapped in, not preloaded.** A preload would make two requests for the same file.

## Test plan

`tests/test_UAT_FC_REQ-652_zoom_rendition.test.ts` (node: real ladder, `publishSite`, renderer and `prepareCatalogPhotos`; only the image service and the bucket are faked):
- a zoomed wide picture gets exactly one 3,000 px rendition, which is in neither `srcset` ladder;
- an image without `zoom` gets no 3,000 px rendition, and a ladder told of no zoomed pictures builds none;
- a zoomed picture not wider than 3,000 px is never upscaled;
- publish writes the rendition for the zoomed photo only. The page names it once, as the viewer's `data-l1-zoom-hi`, with no `src`, and never the original;
- a render without a ladder (draft/preview) names no zoom rendition;
- a catalog photo gets the rendition beside its ladder, and an entry prepared before this change is prepared again exactly once.

`tests/test_UAT_FC_REQ-652_zoom_rendition_viewer.test.ts` (Chromium, the real product page):
- opening the viewer requests no ~3,000 px file. Zooming in requests it once, and zooming further, resetting and zooming again request nothing more. No request ever goes to the original upload;
- a photo without a zoom rendition zooms on its 1,920 px rendition.