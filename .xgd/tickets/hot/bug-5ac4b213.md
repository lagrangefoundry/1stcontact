---
uid: bug-5ac4b213
id: BUG-358
type: bug
title: import_from_site stores Next.js /_next/image pictures as octet-stream documents,
  which then can't be viewed or placed
created_by: xgd
created_at: '2026-11-05T19:37:44.250467+00:00'
updated_at: '2026-11-05T21:13:54.092875+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-db2f911b
  severity: medium
  commits:
  - working_sha: c7ef6d56c8c0b3b3ee76ce1a6b980d38364270d5
    reconcile_sha: null
    main_sha: null
  version: 0.2.786
  story_points: 2
---

**What I did:** `site_material` on a captured Next.js site (bundle `joyful-culinary-creations.vercel.app/index`), then `import_from_site` with 9 picture ids it offered (kind `picture`).

**Expected:** each arrives as an image (IMAGE-n), described, placeable.

**What happened:** 8 of 9 arrived as `kind: document`, filename `image`, content_type `application/octet-stream`, describer status `unsupported` (DOC-2…DOC-9). Only `icon.png` (a plain static URL) arrived as an image (IMAGE-11). `screenshot` with kind image refuses DOC-2 ("no stored picture called 'DOC-2'"), so they can't be looked at or placed.

**Likely cause:** the source URLs are Next.js image-optimizer endpoints, e.g. `/_next/image/?url=%2Fimg%2Freal%2Fmeal-prep-spread.jpg&w=1920&q=75`. They have no file extension, and the response type is negotiated (webp/avif/jpeg by Accept). The importer seems to take the type from the extension or the filename, or lose the response Content-Type. Sniffing magic bytes, or rewriting to the underlying `url=` param (`/img/real/meal-prep-spread.jpg`) and fetching that, would fix it.

**Repro:** capture any Next.js site that uses next/image, run site_material, then import any `_next/image` picture.

## Root cause

Capture mirrors each response under its path's last segment, so every `/_next/image?url=…` response is stored as `assets/image`, `assets/image-1`, … with no extension. `importFromSite` (`apps/control-app/src/site-import.ts`) took the picture's type from that stored name (`contentTypeOf(asset.localPath)`), which is `application/octet-stream`, and its filename from the address's path tail (`image`). The material pipeline then classified each one as a document.

Related, same cause: `pictureStem` reads the name the same way, so every optimizer picture had the stem `image`. Two different photos of the same shape counted as "smaller copies" of each other, and `site_material` dropped all but one of them.

## Fix

- **Type from the bytes.** A picture brought in from a capture takes its content type from its leading bytes (PNG, JPEG, GIF, WebP, AVIF, SVG). Only when the bytes don't name a format does it fall back to the stored name. The stored filename's extension follows the actual format, so a `.jpg` address served as WebP is stored as `.webp`.
- **Name from the underlying picture.** When an address has no extension in its last segment and a `url` / `src` query parameter names a picture file (the image-optimizer pattern used by Next.js `/_next/image`, Vercel `/_vercel/image` and others), the picture's offered file name and its de-duplication stem come from that underlying address. So `site_material` offers `meal-prep-spread.jpg`, and different photos stay separate. Nothing is hardcoded to `_next`.
- `source` (where it was fetched from, and the in-Library key) is unchanged.

Not in scope: Library items already brought in wrongly (DOC-2…DOC-9) keep their `source_url`, so `site_material` still lists them as `in_library`. The fix applies to new imports. Those rows have to be removed before re-importing.

## Test plan

`tests/test_UAT_FC_BUG-358_optimizer_pictures_import_as_images.workers.test.ts`, the same rig as the REQ-474 UAT. It captures a client page whose pictures are two different same-shaped WebP photos served from `/_next/image?url=…` addresses, then checks:
- `site_material` offers both, named after their underlying files.
- `import_from_site` brings both in as `image` items with `image/webp` content type and a `.webp` filename.
Regression: the REQ-474 UAT file.