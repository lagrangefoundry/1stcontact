---
uid: acceptance_criterion-efce53f1
id: AC-2548
type: acceptance_criterion
title: The material file route serves the edited picture by default in its stored
  format, the stored bytes with original=1, and unedited pictures untransformed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:57.894556+00:00'
updated_at: '2026-11-09T18:25:57.894556+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
The builder's material file route (`GET /api/material/file?uid=`) serves pictures as follows:
- **Edited picture, by default:** the picture as it currently stands, with the recipe applied. The response is 200 with `content-disposition: inline` and the original filename.
- **Format kept:** the content type is the picture's stored format. A PNG stays PNG and a JPEG stays JPEG.
- **With `?original=1`:** the stored bytes, unchanged, whatever recipe the picture carries.
- **Never-edited picture:** the stored bytes, byte-identical, without invoking the renderer.

## Verification
1. Store a PNG with a `rotate 90` recipe. Fetch the route and assert a PNG whose dimensions are swapped; rotate is honoured by the local renderer.
2. Fetch with `?original=1` and assert the response is byte-identical to the upload.
3. For an unedited picture, assert the bytes are identical and that a recording binding double saw no transform.
