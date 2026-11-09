---
uid: acceptance_criterion-2a5776cd
id: AC-2538
type: acceptance_criterion
title: The file picker an upload area opens says which types it takes, names HEIC,
  and does not use image/*
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T17:46:06.492414+00:00'
updated_at: '2026-11-09T20:20:31.782156+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

The file picker that an upload area opens says which types it takes, so the commonest case does
not have to be learned from a refusal.

- **It names HEIC.** The list includes the `.heic` and `.heif` extensions and the `image/heic`
  and `image/heif` media types, because the platform takes an iPhone photograph and a picker that
  greyed it out would turn away a file the product handles.
- **It names the formats the platform reads** (common picture formats such as JPEG, PNG, GIF,
  WebP, AVIF and SVG, and the documents the describer reads, such as PDF, Markdown, plain text
  and CSV) by extension or media type, and **does not use the `image/*` wildcard**. What that
  wildcard admits depends on the client's operating system and browser.
- **It is a hint, not a gate.** A file dragged onto an area is not checked against the list, and
  the client can still choose any file in the picker. The platform's own refusals remain the
  only enforcement.

## Verification

Raise the overlay and inspect the file input that its areas activate. Assert its accept list
contains `.heic`, `.heif`, `image/heic` and `image/heif` alongside the picture and document
formats, does not contain `image/*`, and that multiple selection is still allowed. Drop a file
whose type is not on the list onto an area and assert it is still handed over with that area's
role.