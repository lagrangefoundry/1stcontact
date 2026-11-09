---
uid: acceptance_criterion-885ebed9
id: AC-2534
type: acceptance_criterion
title: A HEIC/HEIF upload, recognised by its ftyp brand whatever its declared type,
  is stored as a JPEG image named with a .jpg extension
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T17:45:58.990523+00:00'
updated_at: '2026-11-09T17:45:58.990523+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

A HEIC/HEIF photograph handed to the platform through the upload entry point is stored as an
ordinary JPEG image, whatever the sender said about it.

- **Recognised by its bytes, never by its declared type.** A file is HEIF when it is an ISO
  base-media file whose `ftyp` major brand is one of `heic`, `heix`, `hevc`, `hevx`, `heim`,
  `heis`, `mif1` or `msf1`. The declared type is not consulted in either direction: such a file
  is converted whether it was declared `image/heic` or arrived with no type at all (the ordinary
  case for a file dragged from Finder), and a file declared `image/heic` whose bytes are not HEIF
  is not converted.
- **What is stored is the JPEG and only the JPEG.** The material's stored bytes are JPEG, the
  record of those bytes carries `image/jpeg`, and the material is filed as an image. The original
  HEIC bytes are not kept anywhere.
- **The name changes with the bytes.** The extension is replaced by `.jpg` (`shopfront.HEIC` →
  `shopfront.jpg`, never `shopfront.HEIC.jpg`); a name with no extension gains `.jpg`; a name
  that is only an extension (`.HEIC`) becomes `photograph.jpg`. The name the Library lists and
  the name on the record of the stored bytes are that rewritten name.
- **The conversion happens with the upload, not later.** When the upload answers, the bytes that
  were stored are already the JPEG.

## Verification

Through the upload route, with the converter seam returning JPEG bytes, upload HEIF bytes
(an `ftyp` box with a HEIF brand) parameterized over: declared `image/heic`; no declared type;
each of the eight brands. Assert the material is an image, its stored bytes are the converted
JPEG with type `image/jpeg`, the converter received the original bytes, and no copy of the
original bytes was written. Parameterize the rename over `shopfront.HEIC`, `IMG_0001` and
`.HEIC`, asserting `shopfront.jpg`, `IMG_0001.jpg` and `photograph.jpg`. Upload non-HEIF bytes
declared `image/heic` and assert the converter was never called.
