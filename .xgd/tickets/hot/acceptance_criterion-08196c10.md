---
uid: acceptance_criterion-08196c10
id: AC-2535
type: acceptance_criterion
title: AVIF is not converted, and every upload that is not HEIF is stored byte for
  byte under its own name
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T17:46:00.502575+00:00'
updated_at: '2026-11-09T18:22:54.794646+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

Only HEIF is converted. Every other upload is stored exactly as it arrived.

- **AVIF is left alone.** AVIF is the same ISO base-media container, but its brands (`avif`,
  `avis`) are not HEIF brands, so an AVIF upload is stored as AVIF, under its own name, and is
  never handed to the converter. Converting it would re-encode an image the platform already
  stores, previews and serves, and lose quality for no reason.
- **Everything that is not HEIF passes through byte for byte.** The HEIF check runs on every
  upload; for a JPEG, PNG, AVIF, PDF or any other file the stored bytes are identical to the
  uploaded bytes and the name is unchanged. Nothing is re-encoded on the way through.

## Verification

Through the upload route, with a converter seam that records its calls, upload AVIF bytes
(an `ftyp` box with brand `avif`, then `avis`) and a non-ISO file such as a PNG. Assert the
converter was never called, and that each material's stored bytes equal the uploaded bytes and
its name is the uploaded name.