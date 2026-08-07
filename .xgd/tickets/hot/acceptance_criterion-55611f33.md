---
uid: acceptance_criterion-55611f33
id: AC-908
type: acceptance_criterion
title: Each response is typed from the object that answered, with unknown extensions
  served as generic binary
created_by: xgd
created_at: '2026-08-06T18:49:07.892587+00:00'
updated_at: '2026-08-07T22:18:24.396749+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The content type of a served response is derived from the extension of the
object that answered the request, covering at minimum markup, stylesheets,
scripts, JSON, plain text, XML, SVG, PNG, JPEG, GIF, WebP, AVIF, icons and web
fonts, with text formats carrying a UTF-8 charset. An object whose extension is
not recognised, or which has no extension, is served as a generic binary type
rather than guessed at. The type served does not depend on metadata recorded by
whatever wrote the object, so the same file is typed identically however it was
uploaded.

## Verification

Deploy a snapshot containing one file of each supported kind plus one with an
unrecognised extension and one with none; request each and assert the exact
content type. Assert the types the server reports agree with those recorded at
deploy time for the same extensions. Store an object with deliberately wrong
recorded metadata and assert the served type still follows the extension.