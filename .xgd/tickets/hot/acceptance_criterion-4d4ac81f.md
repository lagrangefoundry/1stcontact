---
uid: acceptance_criterion-4d4ac81f
id: AC-1089
type: acceptance_criterion
title: An element outside the page's vocabulary is refused whole, and the draft is
  left byte-for-byte unchanged
created_by: xgd
created_at: '2026-08-10T09:20:07.806002+00:00'
updated_at: '2026-08-10T09:20:07.806002+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

A replacement that is not a well-formed element of the page's own closed vocabulary is
refused with a schema-invalid failure, nothing is written, and the draft is left
byte-for-byte as it was. This holds for each of these, which together are what "the
assistant cannot write markup, stylesheets or scripts" now rests on:

- an element carrying a raw-markup property;
- an element carrying a raw-stylesheet property;
- an element whose link role points at a script URL;
- an image element whose file points at a script URL;
- an element of a kind the vocabulary does not declare;
- a declared kind carrying the wrong type of value for one of its typed properties.

The guarantee is therefore a property of the vocabulary being closed, not of the surface
declining to offer an operation. A way to get any of the above accepted is a security
defect against this story.

## Verification

Capture the draft's bytes. Through the surface, attempt each of the six replacements above
at a valid address. Assert every one comes back as a schema-invalid refusal, then assert
the draft's bytes are identical to the capture — a refusal is never a partial write.
