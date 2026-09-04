---
uid: acceptance_criterion-df39f35c
id: AC-1561
type: acceptance_criterion
title: Selecting a row shows the file itself — a picture renders, and every kind is
  reachable by its own name
created_by: xgd
created_at: '2026-09-04T04:26:50.185901+00:00'
updated_at: '2026-09-04T04:45:38.782402+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

Selecting a row opens the material in the detail area showing the file, not merely a reference to
it:

- An image is rendered visibly, addressed at the bytes this account holds, and carries the
  material's name as its text alternative.
- Material of every kind — including material that cannot be rendered, such as a document or a font
  — is offered by the name it arrived under, in a form that opens or saves the actual file.
- If the bytes cannot be retrieved for a material that claims them, the detail area says so in
  plain words in place of the preview, rather than leaving a broken image.

## Verification

Select an image row and assert a rendered image is present, that its source resolves to this
account's copy of those bytes, and that its text alternative is the material's name. Select a
non-image row and assert no image is rendered but the file is still offered under its original
filename. Make the byte retrieval fail for a selected image and assert the pane shows the
plain-language message instead of a broken image.